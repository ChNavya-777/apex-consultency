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

async function loadSessions(): Promise<ConsultationSession[]> {
  const { readSheetRows } = await import("@/lib/sheets.server");
  const rows = await readSheetRows(BOOKING_SHEET_ID, BOOKING_RANGE);
  return rows.map(toSession).filter((s): s is ConsultationSession => s !== null);
}

async function loadStudentProfiles(): Promise<{
  profiles: Map<string, StudentProfile>;
  error: string | null;
}> {
  if (!STUDENT_SHEET_ID) {
    return {
      profiles: new Map(),
      error: "Student Sheet is not configured, so student profile details are unavailable.",
    };
  }
  try {
    const { readSheetRows } = await import("@/lib/sheets.server");
    const rows = await readSheetRows(STUDENT_SHEET_ID, STUDENT_RANGE);
    return { profiles: latestProfilesByEmail(rows), error: null };
  } catch (error) {
    console.error("Student Sheet read failed:", error);
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
  .handler(async ({ data }): Promise<PortalData> => {
    if (!data.counsellorEmail) return { sessions: [], students: [], studentSourceError: null };

    const all = await loadSessions();
    const mine = all.filter((s) => s.counsellorEmail === data.counsellorEmail);

    const unmatched = all.filter((s) => !s.counsellorEmail);
    if (unmatched.length > 0) {
      console.warn(`Booking Sheet: ${unmatched.length} row(s) have no counsellor_email.`);
    }

    const { profiles, error } = await loadStudentProfiles();
    return { sessions: mine, students: compose(mine, profiles), studentSourceError: error };
  });

/** Every session and student — Super Admin scope. */
export const getAdminPortalData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalData> => {
    const sessions = await loadSessions();
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

    return { sessions, students: compose(sessions, profiles), studentSourceError: error };
  },
);

/** Sessions + profile for ONE student, filtered by their login email. */
export const getStudentPortalData = createServerFn({ method: "GET" })
  .inputValidator((input: { studentEmail: string }) => ({
    studentEmail: normalizeEmail(input?.studentEmail),
  }))
  .handler(async ({ data }): Promise<PortalData> => {
    if (!data.studentEmail) return { sessions: [], students: [], studentSourceError: null };
    const all = await loadSessions();
    const mine = all.filter((s) => s.studentEmail === data.studentEmail);
    const { profiles, error } = await loadStudentProfiles();
    const profile =
      profiles.get(data.studentEmail) ??
      placeholderProfile(data.studentEmail, mine[0]?.studentName ?? "");
    return { sessions: mine, students: [profile], studentSourceError: error };
  });
