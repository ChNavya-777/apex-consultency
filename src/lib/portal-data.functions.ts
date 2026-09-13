/**
 * Portal data layer — reads the external sheets on the server and returns only the rows the
 * caller is allowed to see.
 *
 * Sources stay separate and read-only:
 *   Booking Sheet  → sessions (counsellor assignment lives here, via `counsellor_email`)
 *   Student Sheet  → student profile/enquiry information (matched by normalised email)
 *
 * A counsellor request never returns another counsellor's rows: the filter runs here, before
 * anything is serialised to the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import { findRosterCounsellor, normalizeEmail } from "@/lib/counsellor-roster";
import { sessionSlot } from "@/lib/sessions";
import type { ConsultationSession, SessionStatus } from "@/lib/sessions";

import type { PortalData, StudentProfile } from "@/lib/portal-data";

/** Booking/Calendly Sheet ("mentor details"). Overridable without a code change. */
const BOOKING_SHEET_ID =
  process.env["BOOKING_SHEET_ID"] ?? "1qAOhsbQSOAgS9a59ReIz3JGygbF4iyoF7pfSGoJXJgA";
const BOOKING_RANGE = "A1:P2000";

/** Student Sheet — the sheet the consultation form writes to. Read-only here. */
const STUDENT_SHEET_ID =
  process.env["STUDENT_SHEET_ID"] ?? "148rOw6K2fubWP4A7PitCKHxyqspz2pZ50wZAZGpOu-o";
const STUDENT_RANGE = "A1:Z5000";

/* ------------------------------------------------------------------ */
/* Booking Sheet → sessions                                           */
/* ------------------------------------------------------------------ */

function lastPathSegment(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] ?? "";
}

function parseQuestions(raw: string): { question: string; answer: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        const question = String(record["question"] ?? "").trim();
        const answer = String(record["answer"] ?? "").trim();
        return { question, answer };
      })
      .filter((qa) => qa.question || qa.answer);
  } catch {
    return [];
  }
}

function bookingStatusToSessionStatus(row: Record<string, string>): {
  status: SessionStatus | undefined;
  rescheduled: boolean;
} {
  const booking = (row["booking_status"] ?? "").toLowerCase();
  const invitee = (row["invitee_status"] ?? "").toLowerCase();
  const event = (row["booking_event"] ?? "").toLowerCase();

  const rescheduled = event.includes("reschedul") || booking.includes("reschedul");
  const cancelled =
    booking.includes("cancel") || invitee.includes("cancel") || event.includes("cancel");

  if (cancelled) return { status: "cancelled", rescheduled };
  return { status: undefined, rescheduled };
}

function toSession(row: Record<string, string>): ConsultationSession | null {
  const studentEmail = normalizeEmail(row["student_email"]);
  const counsellorEmail = normalizeEmail(row["counsellor_email"]);
  const startTime = row["start_time"] ?? "";
  const endTime = row["end_time"] ?? "";
  const eventUri = row["event_uri"] ?? "";
  const cancelUrl = row["cancel_url"] ?? "";

  // A booking with no identity at all is unusable.
  if (!studentEmail && !eventUri && !cancelUrl) return null;

  // Per-booking-instance id: the invitee id from the cancel/reschedule link, else the event id.
  const bookingUid =
    lastPathSegment(cancelUrl) || lastPathSegment(eventUri) || `${studentEmail}-${startTime}`;

  const { status, rescheduled } = bookingStatusToSessionStatus(row);
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const resolvedStatus: SessionStatus | undefined =
    status ?? (Number.isNaN(end) ? undefined : end < now ? "completed" : "upcoming");

  return {
    bookingUid,
    studentName: row["student_name"] ?? "",
    studentEmail,
    // Booking Sheet name is authoritative; the mentor roster only fills a blank name for a
    // counsellor_email that matches — unmatched counsellors are never substituted.
    counsellorName:
      (row["counsellor_name"] ?? "").trim() ||
      findRosterCounsellor(counsellorEmail)?.name ||
      "",
    counsellorEmail,
    startTime,
    endTime,
    timezone: row["timezone"] ?? null,
    sessionName: row["session_name"] ?? "",
    bookingEvent: row["booking_event"] ?? "",
    bookingStatus: row["booking_status"] ?? "",
    inviteeStatus: row["invitee_status"] ?? "",
    eventUri,
    cancelUrl: cancelUrl || null,
    rescheduleUrl: row["reschedule_url"] || null,
    questionsAndAnswers: parseQuestions(row["questions_and_answers"] ?? ""),
    rescheduled,
    status: resolvedStatus,
    meetingUrl: null,
  };
}

/* ------------------------------------------------------------------ */
/* Student Sheet → profiles                                           */
/* ------------------------------------------------------------------ */

/** Header lookup that tolerates spacing/punctuation differences in the sheet. */
function pick(row: Record<string, string>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  const simplify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const candidate of candidates) {
    const target = simplify(candidate);
    const key = keys.find((k) => simplify(k) === target);
    if (key) {
      const value = (row[key] ?? "").trim();
      if (value) return value;
    }
  }
  for (const candidate of candidates) {
    const target = simplify(candidate);
    const key = keys.find((k) => simplify(k).includes(target));
    if (key) {
      const value = (row[key] ?? "").trim();
      if (value) return value;
    }
  }
  return null;
}

function submittedAtValue(row: Record<string, string>): number {
  const raw = pick(row, ["Submitted At", "submittedAt", "Timestamp"]);
  if (!raw) return 0;
  const direct = new Date(raw).getTime();
  if (!Number.isNaN(direct)) return direct;
  // dd/mm/yyyy, hh:mm:ss (IST strings written by the form proxy)
  const match = raw.match(/(\d{1,2})\D(\d{1,2})\D(\d{4})\D+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, d, m, y, hh, mm, ss] = match;
    const parsed = Date.UTC(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss ?? "0"),
    );
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function toStudentProfile(row: Record<string, string>): StudentProfile | null {
  const email = normalizeEmail(pick(row, ["Email", "email"]));
  if (!email) return null;
  return {
    email,
    fullName: pick(row, ["Full Name", "fullName", "Name"]),
    phone: pick(row, ["Phone", "phone", "Mobile"]),
    currentDegree: pick(row, ["Current Degree", "currentDegree", "Degree"]),
    branch: pick(row, ["Branch / Specialisation", "Branch", "branch", "Specialisation"]),
    graduationYear: pick(row, ["Graduation Year", "graduationYear"]),
    cgpa: pick(row, ["CGPA / Percentage", "CGPA", "cgpa", "Percentage"]),
    preferredCountry: pick(row, ["Preferred Country", "preferredCountry", "Country"]),
    preferredCourse: pick(row, ["Preferred Course", "preferredCourse", "Course"]),
    preferredIntake: pick(row, ["Preferred Intake", "preferredIntake", "Intake"]),
    englishTest: pick(row, ["IELTS / PTE Status", "ieltsPteStatus", "IELTS"]),
    budget: pick(row, ["Budget Range", "budgetRange", "Budget"]),
    additionalInfo: pick(row, [
      "Anything Else We Should Know",
      "additionalInfo",
      "Additional Info",
    ]),
    submittedAt: pick(row, ["Submitted At", "submittedAt", "Timestamp"]),
    found: true,
  };
}

/** One profile per email: the most recent valid submission wins (test duplicates collapse). */
function latestProfilesByEmail(rows: Record<string, string>[]): Map<string, StudentProfile> {
  const best = new Map<string, { profile: StudentProfile; rank: number; index: number }>();
  rows.forEach((row, index) => {
    const profile = toStudentProfile(row);
    if (!profile) return;
    const rank = submittedAtValue(row);
    const current = best.get(profile.email);
    if (!current || rank > current.rank || (rank === current.rank && index > current.index)) {
      best.set(profile.email, { profile, rank, index });
    }
  });
  return new Map([...best].map(([email, entry]) => [email, entry.profile]));
}

function placeholderProfile(email: string, name: string): StudentProfile {
  return {
    email,
    fullName: name || null,
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
}

/* ------------------------------------------------------------------ */
/* Composition                                                        */
/* ------------------------------------------------------------------ */

/**
 * Sorts sessions by their actual scheduled meeting start (earliest first), using the shared
 * slot logic. Ties break on the slot end; rows without a usable slot sink to the bottom.
 */
function sortByMeetingTime(sessions: ConsultationSession[]): ConsultationSession[] {
  const key = (s: ConsultationSession) => {
    const { start, end } = sessionSlot(s);
    const startMs = start?.getTime();
    const endMs = end?.getTime();
    return {
      start: typeof startMs === "number" && Number.isFinite(startMs) ? startMs : null,
      end: typeof endMs === "number" && Number.isFinite(endMs) ? endMs : null,
    };
  };
  return [...sessions].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka.start === null && kb.start === null) return 0;
    if (ka.start === null) return 1;
    if (kb.start === null) return -1;
    if (ka.start !== kb.start) return ka.start - kb.start;
    return (ka.end ?? ka.start) - (kb.end ?? kb.start);
  });
}

/*
 * Phase 6B: portal reads come from Supabase (see `portal-supabase.server.ts`). The Google Sheets
 * helpers above stay in place for the integration flows and are no longer used for portal reads.
 */

async function loadSessions(): Promise<{ sessions: ConsultationSession[]; error: string | null }> {
  try {
    const { readPortalSnapshot } = await import("@/lib/portal-supabase.server");
    const { sessions } = await readPortalSnapshot();
    return { sessions: sortByMeetingTime(sessions), error: null };
  } catch (error) {
    // A failed read must not blank the portal.
    console.error("Supabase session read failed:", error);
    return {
      sessions: [],
      error: "Session details are temporarily unavailable. Please try again in a moment.",
    };
  }
}

async function loadStudentProfiles(): Promise<{
  profiles: Map<string, StudentProfile>;
  error: string | null;
}> {
  try {
    const { readPortalSnapshot } = await import("@/lib/portal-supabase.server");
    const { profiles } = await readPortalSnapshot();
    return { profiles, error: null };
  } catch (error) {
    console.error("Supabase student profile read failed:", error);
    return { profiles: new Map(), error: "Student profile details are temporarily unavailable." };
  }
}


function compose(sessions: ConsultationSession[], profiles: Map<string, StudentProfile>) {
  const students: StudentProfile[] = [];
  const seen = new Set<string>();
  for (const session of sessions) {
    const email = session.studentEmail;
    if (!email || seen.has(email)) continue;
    seen.add(email);
    students.push(profiles.get(email) ?? placeholderProfile(email, session.studentName));
  }
  return students;
}

/** Sessions + students for ONE counsellor, filtered by their login email. */
export const getCounsellorPortalData = createServerFn({ method: "GET" })
  .inputValidator((input: { counsellorEmail: string }) => ({
    counsellorEmail: normalizeEmail(input?.counsellorEmail),
  }))
  .handler(async ({ request }): Promise<PortalData> => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role && authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const targetEmail = authCtx.user.email;
    if (!targetEmail) return { sessions: [], students: [], studentSourceError: null };

    const { sessions: all, error: sessionError } = await loadSessions();
    const mine = all.filter((s) => s.counsellorEmail === targetEmail);

    const unmatched = all.filter((s) => !s.counsellorEmail);
    if (unmatched.length > 0) {
      console.warn(`Booking Sheet: ${unmatched.length} row(s) have no counsellor_email.`);
    }

    const { profiles, error } = await loadStudentProfiles();
    return {
      sessions: mine,
      students: compose(mine, profiles),
      studentSourceError: sessionError ?? error,
    };
  });

/** Every session and student — Super Admin scope. */
export const getAdminPortalData = createServerFn({ method: "GET" }).handler(
  async ({ request }): Promise<PortalData> => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Super Admin privileges required.");
    }

    const { sessions, error: sessionError } = await loadSessions();
    const { profiles, error } = await loadStudentProfiles();

    const { counsellorRoster } = await import("@/lib/counsellor-roster");
    const known = new Set(counsellorRoster.map((c) => normalizeEmail(c.email)));
    const unmatched = sessions.filter(
      (s) => !s.counsellorEmail || !known.has(s.counsellorEmail),
    );
    if (unmatched.length > 0) {
      console.warn(
        `Booking Sheet: ${unmatched.length} booking(s) reference a counsellor_email that is not a known portal login: ${[
          ...new Set(unmatched.map((s) => s.counsellorEmail || "(empty)")),
        ].join(", ")}`,
      );
    }

    // Super Admin sees every student account, including those without a booking yet.
    let students = compose(sessions, profiles);
    try {
      const { readPortalSnapshot } = await import("@/lib/portal-supabase.server");
      const { allStudents } = await readPortalSnapshot();
      const seen = new Set(students.map((s) => s.email));
      students = [...students, ...allStudents.filter((s) => s.email && !seen.has(s.email))];
    } catch (readError) {
      console.error("Supabase student account read failed:", readError);
    }

    return {
      sessions,
      students,
      studentSourceError: sessionError ?? error,
    };
  },
);

/** Sessions + profile for ONE student, filtered by their login email. */
export const getStudentPortalData = createServerFn({ method: "GET" })
  .inputValidator((input: { studentEmail: string }) => ({
    studentEmail: normalizeEmail(input?.studentEmail),
  }))
  .handler(async ({ request }): Promise<PortalData> => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role && authCtx.role !== "student" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Student access required.");
    }

    const targetEmail = authCtx.user.email;
    if (!targetEmail) return { sessions: [], students: [], studentSourceError: null };

    const { sessions: all, error: sessionError } = await loadSessions();
    const mine = all.filter((s) => s.studentEmail === targetEmail);
    const { profiles, error } = await loadStudentProfiles();
    const profile =
      profiles.get(targetEmail) ?? placeholderProfile(targetEmail, mine[0]?.studentName ?? "");
    return {
      sessions: mine,
      students: [profile],
      studentSourceError: sessionError ?? error,
    };
  });


