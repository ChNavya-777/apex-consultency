/**
 * SERVER-ONLY Supabase portal reader (Phase 6B read-source migration).
 *
 * Portal reads (sessions, session questions, students, student profiles, counsellors) now come
 * from the connected Supabase project instead of the Google Sheets. The Sheets reader
 * (`sheets.server.ts`) stays in place for the write/integration flows and is untouched.
 *
 * RLS stays enabled with no policies, so these reads run through the server-side service-role
 * client inside server-function handlers only — never from the browser.
 *
 * Reliability characteristics mirror the previous sheet reader: a 60s read cache, in-flight
 * de-duplication and a 30-minute stale fallback so a transient failure cannot blank a portal.
 */

import { normalizeEmail } from "@/lib/counsellor-roster";
import type { ConsultationSession, SessionStatus } from "@/lib/sessions";
import type { StudentProfile } from "@/lib/portal-data";

const CACHE_TTL_MS = 60_000;
const STALE_FALLBACK_MS = 30 * 60_000;

type Snapshot = {
  sessions: ConsultationSession[];
  /** Latest profile per normalised student email. */
  profiles: Map<string, StudentProfile>;
  /** Every student account, in email order — Super Admin scope. */
  allStudents: StudentProfile[];
};

const cache = new Map<string, { value: Snapshot; at: number }>();
const inFlight = new Map<string, Promise<Snapshot>>();
const KEY = "portal";

/* ------------------------------------------------------------------ */
/* Row → domain mapping                                               */
/* ------------------------------------------------------------------ */

function iso(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** Same classification the portal has always used: cancelled/rescheduled first, then elapsed. */
function classify(row: {
  booking_status: string | null;
  invitee_status: string | null;
  booking_event: string | null;
  status: string | null;
  rescheduled: boolean | null;
  end_time: string | null;
}): { status: SessionStatus | undefined; rescheduled: boolean } {
  const booking = (row.booking_status ?? "").toLowerCase();
  const invitee = (row.invitee_status ?? "").toLowerCase();
  const event = (row.booking_event ?? "").toLowerCase();
  const stored = (row.status ?? "").toLowerCase();

  const rescheduled =
    row.rescheduled === true || event.includes("reschedul") || booking.includes("reschedul");
  const cancelled =
    stored.includes("cancel") ||
    booking.includes("cancel") ||
    invitee.includes("cancel") ||
    event.includes("cancel");

  if (cancelled) return { status: "cancelled", rescheduled };
  const end = row.end_time ? new Date(row.end_time).getTime() : Number.NaN;
  if (Number.isNaN(end)) return { status: undefined, rescheduled };
  return { status: end < Date.now() ? "completed" : "upcoming", rescheduled };
}

/** Readable submission timestamp in the source timezone the form used (Asia/Kolkata). */
function submittedAtLabel(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
    .format(d)
    .replace("Sept", "Sep");
}

/* ------------------------------------------------------------------ */
/* Snapshot load                                                      */
/* ------------------------------------------------------------------ */

async function fetchSnapshot(): Promise<Snapshot> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [studentsRes, counsellorsRes, profilesRes, sessionsRes, questionsRes] = await Promise.all([
    supabaseAdmin.from("students").select("id, email, full_name").order("email"),
    supabaseAdmin.from("counsellors").select("id, email, full_name"),
    supabaseAdmin
      .from("student_profiles")
      .select(
        "id, student_id, email, phone, current_degree, branch, graduation_year, cgpa, preferred_country, preferred_course, preferred_intake, english_test, budget, additional_info, submitted_at, created_at",
      ),
    supabaseAdmin.from("sessions").select("*"),
    supabaseAdmin.from("session_questions").select("session_id, question, answer, position"),
  ]);

  for (const res of [studentsRes, counsellorsRes, profilesRes, sessionsRes, questionsRes]) {
    if (res.error) throw new Error(`Supabase portal read failed: ${res.error.message}`);
  }

  const students = studentsRes.data ?? [];
  const counsellors = counsellorsRes.data ?? [];
  const profileRows = profilesRes.data ?? [];
  const sessionRows = sessionsRes.data ?? [];
  const questionRows = questionsRes.data ?? [];

  const studentById = new Map(students.map((s) => [s.id, s]));
  const counsellorById = new Map(counsellors.map((c) => [c.id, c]));

  /* Questions grouped by session, in stored order. */
  const questionsBySession = new Map<string, { question: string; answer: string }[]>();
  for (const q of [...questionRows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    const list = questionsBySession.get(q.session_id) ?? [];
    const question = (q.question ?? "").trim();
    const answer = (q.answer ?? "").trim();
    if (question || answer) list.push({ question, answer });
    questionsBySession.set(q.session_id, list);
  }

  const sessions: ConsultationSession[] = sessionRows.map((row) => {
    const student = row.student_id ? studentById.get(row.student_id) : undefined;
    const counsellor = row.counsellor_id ? counsellorById.get(row.counsellor_id) : undefined;
    const { status, rescheduled } = classify(row);
    return {
      bookingUid: row.booking_uid,
      studentName: row.student_name ?? student?.full_name ?? "",
      studentEmail: normalizeEmail(row.student_email ?? student?.email ?? ""),
      studentId: row.student_id ?? null,
      counsellorName: (row.counsellor_name ?? "").trim() || counsellor?.full_name || "",
      counsellorEmail: normalizeEmail(row.counsellor_email ?? counsellor?.email ?? ""),
      // Supabase already stores the actual meeting slot: used as-is, no derivation, no offset.
      startTime: iso(row.start_time),
      endTime: iso(row.end_time),
      timezone: row.timezone ?? null,
      sessionName: row.session_name ?? "",
      bookingEvent: row.booking_event ?? "",
      bookingStatus: row.booking_status ?? "",
      inviteeStatus: row.invitee_status ?? "",
      eventUri: row.event_uri ?? "",
      cancelUrl: row.cancel_url ?? null,
      rescheduleUrl: row.reschedule_url ?? null,
      questionsAndAnswers: questionsBySession.get(row.id) ?? [],
      rescheduled,
      status,
      meetingUrl: null,
    };
  });

  /* Latest submission per student: historical rows stay in the database untouched. */
  const rank = (row: { submitted_at: string | null; created_at: string }) => {
    const t = new Date(row.submitted_at ?? row.created_at).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const best = new Map<string, { profile: StudentProfile; rank: number }>();
  for (const row of profileRows) {
    const student = row.student_id ? studentById.get(row.student_id) : undefined;
    const email = normalizeEmail(row.email || student?.email || "");
    if (!email) continue;
    const profile: StudentProfile = {
      email,
      fullName: student?.full_name ?? null,
      phone: row.phone ?? null,
      currentDegree: row.current_degree ?? null,
      branch: row.branch ?? null,
      graduationYear: row.graduation_year ?? null,
      cgpa: row.cgpa ?? null,
      preferredCountry: row.preferred_country ?? null,
      preferredCourse: row.preferred_course ?? null,
      preferredIntake: row.preferred_intake ?? null,
      englishTest: row.english_test ?? null,
      budget: row.budget ?? null,
      additionalInfo: row.additional_info ?? null,
      submittedAt: submittedAtLabel(row.submitted_at),
      found: true,
    };
    const score = rank(row);
    const current = best.get(email);
    if (!current || score >= current.rank) best.set(email, { profile, rank: score });
  }
  const profiles = new Map([...best].map(([email, entry]) => [email, entry.profile]));

  const allStudents: StudentProfile[] = students.map((s) => {
    const email = normalizeEmail(s.email);
    const profile = profiles.get(email);
    if (profile) return profile;
    return {
      email,
      fullName: s.full_name ?? null,
      phone: null,
      currentDegree: null,
      branch: null,
      graduationYear: null,
      cgpa: null,
      preferredCountry: null,
      preferredCourse: null,
      preferredIntake: null,
      englishTest: null,
      budget: null,
      additionalInfo: null,
      submittedAt: null,
      found: false,
    };
  });

  return { sessions, profiles, allStudents };
}

/** Cached portal snapshot (60s fresh, 30min stale fallback, one in-flight read at a time). */
export async function readPortalSnapshot(): Promise<Snapshot> {
  const cached = cache.get(KEY);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const pending = inFlight.get(KEY);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const value = await fetchSnapshot();
      cache.set(KEY, { value, at: Date.now() });
      return value;
    } catch (error) {
      const stale = cache.get(KEY);
      if (stale && Date.now() - stale.at < STALE_FALLBACK_MS) {
        console.warn("Supabase portal read failed, serving cached snapshot:", error);
        return stale.value;
      }
      throw error;
    } finally {
      inFlight.delete(KEY);
    }
  })();

  inFlight.set(KEY, promise);
  return promise;
}
