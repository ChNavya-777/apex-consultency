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

    let documentsData: import("@/lib/student-documents").StudentDocument[] = [];
    let tasksData: import("@/lib/student-tasks").StudentTask[] = [];
    let shortlistsData: import("@/lib/student-applications").StudentShortlist[] = [];
    let applicationsData: import("@/lib/student-applications").StudentApplication[] = [];

    try {
      const resolvedStudent = await resolveOrCreateStudentUuid(targetEmail);
      if (resolvedStudent?.id) {
        profile.id = resolvedStudent.id;
        const {
          fetchStudentDocumentsData,
          fetchStudentTasksData,
          fetchStudentShortlistsData,
          fetchStudentApplicationsData,
        } = await import("@/lib/portal-supabase.server");

        const [doc, tsk, sl, app] = await Promise.all([
          fetchStudentDocumentsData(resolvedStudent.id),
          fetchStudentTasksData(resolvedStudent.id),
          fetchStudentShortlistsData(resolvedStudent.id),
          fetchStudentApplicationsData(resolvedStudent.id),
        ]);
        documentsData = doc;
        tasksData = tsk;
        shortlistsData = sl;
        applicationsData = app;
      }
    } catch (err) {
      console.warn("[STUDENT_PORTAL_DATA_WARN] Failed to load student portal database items:", err);
    }

    return {
      sessions: mine,
      students: [profile],
      documents: documentsData,
      tasks: tasksData,
      shortlists: shortlistsData,
      applications: applicationsData,
      studentSourceError: sessionError ?? error,
    };
  });

export type UpdateSessionOutcomeInput = {
  bookingUid: string;
  outcome: "completed" | "missed";
  notes?: string | null;
};

export type UpdateSessionOutcomeResponse = {
  success: boolean;
  bookingUid: string;
  counsellorOutcome: "completed" | "missed";
  counsellorNotes: string | null;
  outcomeUpdatedAt: string;
};

/** Secure server-side function for recording counsellor session outcomes. */
export const updateSessionOutcome = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateSessionOutcomeInput) => {
    const bookingUid = String(input?.bookingUid ?? "").trim();
    const outcome = String(input?.outcome ?? "").trim().toLowerCase();
    const rawNotes = input?.notes != null ? String(input.notes) : null;

    if (!bookingUid) {
      throw new Error("400 Bad Request: bookingUid is required.");
    }

    if (outcome !== "completed" && outcome !== "missed") {
      throw new Error(
        "400 Bad Request: Invalid outcome. Allowed values are 'completed' or 'missed'.",
      );
    }

    if (rawNotes && rawNotes.length > 2000) {
      throw new Error("400 Bad Request: Notes exceed maximum length of 2000 characters.");
    }

    return {
      bookingUid,
      outcome: outcome as "completed" | "missed",
      notes: rawNotes ? rawNotes.trim() : null,
    };
  })
  .handler(async ({ data, request }): Promise<UpdateSessionOutcomeResponse> => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor or Super Admin privileges required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load actual session from Supabase
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from("sessions")
      .select("id, booking_uid, counsellor_email, counsellor_id")
      .eq("booking_uid", data.bookingUid)
      .limit(1);

    if (fetchError) {
      console.error(`Session fetch failed for ${data.bookingUid}:`, fetchError.message);
      throw new Error(`500 Internal Server Error: Database lookup failed (${fetchError.message}).`);
    }

    const session = rows?.[0];
    if (!session) {
      throw new Error(`404 Not Found: Session '${data.bookingUid}' does not exist.`);
    }

    // Verify authorized counsellor (counsellor MUST match assigned counsellor_email or counsellor_id; super_admin can update any)
    if (authCtx.role === "counsellor") {
      const authEmail = normalizeEmail(authCtx.user.email);
      let assignedEmail = normalizeEmail(session.counsellor_email);

      // Fallback: if counsellor_email on session is null/empty, check counsellor_id in counsellors table
      if (!assignedEmail && session.counsellor_id) {
        const { data: cRow } = await supabaseAdmin
          .from("counsellors")
          .select("email")
          .eq("id", session.counsellor_id)
          .maybeSingle();
        if (cRow?.email) {
          assignedEmail = normalizeEmail(cRow.email);
        }
      }

      if (!authEmail || !assignedEmail || authEmail !== assignedEmail) {
        throw new Error("403 Forbidden: You are not authorized to update this session.");
      }
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({
        counsellor_outcome: data.outcome,
        counsellor_notes: data.notes,
        outcome_updated_at: nowIso,
      })
      .eq("id", session.id);

    if (updateError) {
      console.error(`Outcome update failed for ${data.bookingUid}:`, updateError.message);
      throw new Error(`500 Internal Server Error: Failed to save session outcome (${updateError.message}).`);
    }

    // Invalidate 60-second snapshot cache so subsequent reads immediately reflect the new outcome
    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return {
      success: true,
      bookingUid: data.bookingUid,
      counsellorOutcome: data.outcome,
      counsellorNotes: data.notes,
      outcomeUpdatedAt: nowIso,
    };
  });

export type CounsellorStudentProfileResponse = {
  student: StudentProfile | null;
  sessions: ConsultationSession[];
  tracking: {
    currentTracking: import("@/lib/student-tracking").StudentTrackingState | null;
    history: import("@/lib/student-tracking").TrackingHistoryItem[];
  };
  notes: import("@/lib/student-tracking").CounsellorStudentNote[];
  documents: import("@/lib/student-documents").StudentDocument[];
  tasks: import("@/lib/student-tasks").StudentTask[];
  shortlists: import("@/lib/student-applications").StudentShortlist[];
  applications: import("@/lib/student-applications").StudentApplication[];
  authorized: boolean;
  error: string | null;
};

/** Secure server-side function for retrieving an authorized counsellor student profile & history. */
export const getCounsellorStudentProfileData = createServerFn({ method: "GET" })
  .inputValidator((input: { studentId: string }) => ({
    studentId: String(input?.studentId ?? "").trim(),
  }))
  .handler(async ({ data, request }): Promise<CounsellorStudentProfileResponse> => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { studentId } = data;
    if (!studentId) {
      return {
        student: null,
        sessions: [],
        tracking: { currentTracking: null, history: [] },
        notes: [],
        documents: [],
        tasks: [],
        shortlists: [],
        applications: [],
        authorized: false,
        error: "Student ID is required.",
      };
    }

    const { sessions: allSessions, error: sessionError } = await loadSessions();
    const { profiles, error: profileError } = await loadStudentProfiles();

    let authorizedStudents: StudentProfile[] = [];
    let authorizedSessions: ConsultationSession[] = [];

    if (authCtx.role === "super_admin") {
      authorizedSessions = allSessions;
      authorizedStudents = compose(allSessions, profiles);
      try {
        const { readPortalSnapshot } = await import("@/lib/portal-supabase.server");
        const { allStudents } = await readPortalSnapshot();
        const seen = new Set(authorizedStudents.map((s) => s.email));
        authorizedStudents = [
          ...authorizedStudents,
          ...allStudents.filter((s) => s.email && !seen.has(s.email)),
        ];
      } catch (e) {
        console.error("Super Admin student profile query error:", e);
      }
    } else {
      const targetEmail = authCtx.user.email;
      authorizedSessions = allSessions.filter((s) => s.counsellorEmail === targetEmail);
      authorizedStudents = compose(authorizedSessions, profiles);
    }

    const normalizedParam = decodeURIComponent(studentId).toLowerCase().trim();
    const targetStudent =
      authorizedStudents.find(
        (s) =>
          (s.id && s.id.toLowerCase() === normalizedParam) ||
          s.email.toLowerCase() === normalizedParam ||
          encodeURIComponent(s.email).toLowerCase() === normalizedParam,
      ) ?? null;

    if (!targetStudent) {
      return {
        student: null,
        sessions: [],
        tracking: { currentTracking: null, history: [] },
        notes: [],
        documents: [],
        tasks: [],
        shortlists: [],
        applications: [],
        authorized: false,
        error: "Student profile not found or not assigned to you.",
      };
    }

    const studentSessions = authorizedSessions.filter((s) => {
      if (targetStudent.id && s.studentId) {
        return s.studentId === targetStudent.id;
      }
      return s.studentEmail.toLowerCase() === targetStudent.email.toLowerCase();
    });

    let trackingData = {
      currentTracking: {
        studentId: targetStudent.id ?? "",
        currentStage: "consultation" as const,
        updatedByCounsellorId: null,
        updatedByCounsellorName: null,
        stageNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      history: [],
    };
    let notesData: import("@/lib/student-tracking").CounsellorStudentNote[] = [];
    let documentsData: import("@/lib/student-documents").StudentDocument[] = [];
    let tasksData: import("@/lib/student-tasks").StudentTask[] = [];
    let shortlistsData: import("@/lib/student-applications").StudentShortlist[] = [];
    let applicationsData: import("@/lib/student-applications").StudentApplication[] = [];

    if (targetStudent.id) {
      try {
        const {
          fetchStudentTrackingData,
          fetchStudentNotesData,
          fetchStudentDocumentsData,
          fetchStudentTasksData,
          fetchStudentShortlistsData,
          fetchStudentApplicationsData,
        } = await import("@/lib/portal-supabase.server");
        const [tr, nt, doc, tsk, sl, app] = await Promise.all([
          fetchStudentTrackingData(targetStudent.id),
          fetchStudentNotesData(targetStudent.id),
          fetchStudentDocumentsData(targetStudent.id),
          fetchStudentTasksData(targetStudent.id),
          fetchStudentShortlistsData(targetStudent.id),
          fetchStudentApplicationsData(targetStudent.id),
        ]);
        trackingData = tr;
        notesData = nt;
        documentsData = doc;
        tasksData = tsk;
        shortlistsData = sl;
        applicationsData = app;
      } catch (err) {
        console.error("Failed to load tracking/notes/documents/tasks/applications data:", err);
      }
    }

    return {
      student: targetStudent,
      sessions: studentSessions,
      tracking: trackingData,
      notes: notesData,
      documents: documentsData,
      tasks: tasksData,
      shortlists: shortlistsData,
      applications: applicationsData,
      authorized: true,
      error: sessionError ?? profileError,
    };
  });

/** Helper to resolve or ensure a student ID exists in public.students table */
async function resolveOrCreateStudentUuid(studentIdOrEmail: string): Promise<{
  id: string;
  email: string;
} | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const normalizedParam = decodeURIComponent(studentIdOrEmail).toLowerCase().trim();

  // 1. Try finding by UUID or email
  const { data: existing } = await supabaseAdmin
    .from("students")
    .select("id, email")
    .or(`id.eq.${normalizedParam},email.ilike.${normalizedParam}`)
    .maybeSingle();

  if (existing) {
    return { id: existing.id, email: existing.email };
  }

  // 2. If it's an email string and doesn't exist yet, insert a row
  if (normalizedParam.includes("@")) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("students")
      .insert({ email: normalizedParam })
      .select("id, email")
      .single();

    if (!insertError && inserted) {
      return { id: inserted.id, email: inserted.email };
    }
  }

  return null;
}

export type UpdateTrackingInput = {
  studentId: string;
  newStage: string;
  stageNotes?: string | null;
};

/** Server function to update a student's tracking stage and record transition history */
export const updateStudentTracking = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateTrackingInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const newStage = String(input?.newStage ?? "").trim().toLowerCase();
    const stageNotes = input?.stageNotes != null ? String(input.stageNotes).trim() : null;

    if (!studentId) {
      throw new Error("400 Bad Request: studentId is required.");
    }

    const { isValidStage } = require("@/lib/student-tracking");
    if (!isValidStage(newStage)) {
      throw new Error(`400 Bad Request: Invalid stage '${newStage}'.`);
    }

    return { studentId, newStage, stageNotes };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to update this student's tracking.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing tracking row
    const { data: existingTracking } = await supabaseAdmin
      .from("student_tracking")
      .select("*")
      .eq("student_id", resolvedStudent.id)
      .maybeSingle();

    const previousStage = existingTracking?.current_stage ?? null;
    const isStageChanged = previousStage !== data.newStage;

    // Fetch counsellor details for audit attribution
    let counsellorId: string | null = null;
    let counsellorName: string | null = authCtx.user.email;

    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id, full_name")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    if (cRow) {
      counsellorId = cRow.id;
      counsellorName = cRow.full_name || authCtx.user.email;
    }

    const nowIso = new Date().toISOString();

    // Upsert student_tracking
    const { error: upsertError } = await supabaseAdmin
      .from("student_tracking")
      .upsert({
        student_id: resolvedStudent.id,
        current_stage: data.newStage,
        updated_by_counsellor_id: counsellorId,
        updated_by_counsellor_name: counsellorName,
        stage_notes: data.stageNotes,
        updated_at: nowIso,
      }, { onConflict: "student_id" });

    if (upsertError) {
      console.error(`Failed to update tracking for student ${resolvedStudent.id}:`, upsertError.message);
      throw new Error(`500 Internal Server Error: ${upsertError.message}`);
    }

    // Record history ONLY if stage actually changed
    if (isStageChanged) {
      const { error: historyError } = await supabaseAdmin
        .from("student_tracking_history")
        .insert({
          student_id: resolvedStudent.id,
          stage: data.newStage,
          previous_stage: previousStage,
          changed_by_counsellor_id: counsellorId,
          changed_by_counsellor_name: counsellorName,
          notes: data.stageNotes,
          created_at: nowIso,
        });

      if (historyError) {
        console.error(`Failed to insert tracking history:`, historyError.message);
      }
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return {
      success: true,
      currentStage: data.newStage,
      updatedAt: nowIso,
    };
  });

export type CreateNoteInput = {
  studentId: string;
  noteText: string;
  category?: string;
  isPinned?: boolean;
};

/** Server function to create a standalone counsellor note for a student */
export const createStudentNote = createServerFn({ method: "POST" })
  .inputValidator((input: CreateNoteInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const noteText = String(input?.noteText ?? "").trim();
    const category = String(input?.category ?? "general").trim().toLowerCase();
    const isPinned = Boolean(input?.isPinned);

    if (!studentId) {
      throw new Error("400 Bad Request: studentId is required.");
    }
    if (!noteText) {
      throw new Error("400 Bad Request: noteText is required.");
    }

    return { studentId, noteText, category, isPinned };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to add notes for this student.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let counsellorId: string | null = null;
    let counsellorName: string = authCtx.user.email;

    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id, full_name")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    if (cRow) {
      counsellorId = cRow.id;
      counsellorName = cRow.full_name || authCtx.user.email;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("counsellor_student_notes")
      .insert({
        student_id: resolvedStudent.id,
        counsellor_id: counsellorId,
        counsellor_name: counsellorName,
        counsellor_email: authCtx.user.email,
        note_text: data.noteText,
        category: data.category,
        is_pinned: data.isPinned,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to insert counsellor note:", insertError?.message);
      throw new Error(`500 Internal Server Error: ${insertError?.message || "Insert failed"}`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return {
      success: true,
      note: {
        id: inserted.id,
        studentId: inserted.student_id,
        counsellorId: inserted.counsellor_id,
        counsellorName: inserted.counsellor_name,
        counsellorEmail: inserted.counsellor_email,
        noteText: inserted.note_text,
        category: inserted.category as any,
        isPinned: inserted.is_pinned,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      },
    };
  });

export type TogglePinNoteInput = {
  noteId: string;
  studentId: string;
  isPinned: boolean;
};

/** Server function to pin or unpin a counsellor note */
export const togglePinStudentNote = createServerFn({ method: "POST" })
  .inputValidator((input: TogglePinNoteInput) => {
    const noteId = String(input?.noteId ?? "").trim();
    const studentId = String(input?.studentId ?? "").trim();
    const isPinned = Boolean(input?.isPinned);

    if (!noteId || !studentId) {
      throw new Error("400 Bad Request: noteId and studentId are required.");
    }

    return { noteId, studentId, isPinned };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: updateError } = await supabaseAdmin
      .from("counsellor_student_notes")
      .update({ is_pinned: data.isPinned, updated_at: new Date().toISOString() })
      .eq("id", data.noteId);

    if (updateError) {
      console.error(`Failed to update note ${data.noteId}:`, updateError.message);
      throw new Error(`500 Internal Server Error: ${updateError.message}`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, isPinned: data.isPinned };
  });

export type DeleteNoteInput = {
  noteId: string;
  studentId: string;
};

/** Server function to delete a counsellor note */
export const deleteStudentNote = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteNoteInput) => {
    const noteId = String(input?.noteId ?? "").trim();
    const studentId = String(input?.studentId ?? "").trim();

    if (!noteId || !studentId) {
      throw new Error("400 Bad Request: noteId and studentId are required.");
    }

    return { noteId, studentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: deleteError } = await supabaseAdmin
      .from("counsellor_student_notes")
      .delete()
      .eq("id", data.noteId);

    if (deleteError) {
      console.error(`Failed to delete note ${data.noteId}:`, deleteError.message);
      throw new Error(`500 Internal Server Error: ${deleteError.message}`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true };
  });

/* ------------------------------------------------------------------ */
/* Phase 3: Student Documents Server Functions                        */
/* ------------------------------------------------------------------ */

export type PrepareDocumentUploadInput = {
  studentId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  category: string;
  docType?: string | null;
};

/** Server function to validate document metadata, insert a pending record, and create signed upload URL */
export const prepareDocumentUpload = createServerFn({ method: "POST" })
  .inputValidator((input: PrepareDocumentUploadInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const filename = String(input?.filename ?? "").trim();
    const fileSize = Number(input?.fileSize ?? 0);
    const mimeType = String(input?.mimeType ?? "").trim();
    const category = String(input?.category ?? "application_documents").trim().toLowerCase();
    const docType = input?.docType ? String(input.docType).trim() : null;

    if (!studentId) {
      throw new Error("400 Bad Request: studentId is required.");
    }

    const { validateDocumentFile } = require("@/lib/student-documents");
    const valResult = validateDocumentFile(filename, mimeType, fileSize, docType);
    if (!valResult.valid) {
      throw new Error(`400 Bad Request: ${valResult.error}`);
    }

    return { studentId, filename, fileSize, mimeType, category, docType };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Role verification
    if (authCtx.role === "student") {
      if (authCtx.user.email.toLowerCase() !== resolvedStudent.email.toLowerCase()) {
        throw new Error("403 Forbidden: You can only upload documents to your own profile.");
      }
    } else if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to upload documents for this student.");
      }
    } else if (authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Unauthorized role.");
    }

    const { sanitizeFilename } = await import("@/lib/student-documents");
    const sanitizedName = sanitizeFilename(data.filename);
    const documentId = crypto.randomUUID();
    const storagePath = `students/${resolvedStudent.id}/${documentId}/${sanitizedName}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let counsellorId: string | null = null;
    let counsellorName: string = authCtx.role === "student" ? "Student" : authCtx.user.email;

    if (authCtx.role !== "student") {
      const { data: cRow } = await supabaseAdmin
        .from("counsellors")
        .select("id, full_name")
        .ilike("email", authCtx.user.email)
        .maybeSingle();

      if (cRow) {
        counsellorId = cRow.id;
        counsellorName = cRow.full_name || authCtx.user.email;
      }
    }

    // Create pending metadata record
    const { error: dbError } = await supabaseAdmin.from("student_documents").insert({
      id: documentId,
      student_id: resolvedStudent.id,
      storage_path: storagePath,
      original_filename: sanitizedName,
      mime_type: data.mimeType,
      file_size: data.fileSize,
      category: data.category,
      doc_type: data.docType,
      status: "pending",
      uploaded_by_counsellor_id: counsellorId,
      uploaded_by_counsellor_name: counsellorName,
    });

    if (dbError) {
      console.error("Failed to create student_documents pending record:", dbError.message);
      throw new Error(`500 Internal Server Error: Could not prepare upload. ${dbError.message}`);
    }

    // Create signed upload authorization
    const { data: uploadData, error: storageError } = await supabaseAdmin.storage
      .from("student-documents")
      .createSignedUploadUrl(storagePath);

    if (storageError || !uploadData) {
      console.error("Failed to create signed upload URL:", storageError?.message);
      await supabaseAdmin.from("student_documents").delete().eq("id", documentId);
      throw new Error(
        `500 Internal Server Error: Failed to generate signed upload authorization. ${storageError?.message ?? ""}`
      );
    }

    return {
      documentId,
      storagePath,
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: uploadData.path,
    };
  });

export type ConfirmDocumentUploadInput = {
  studentId: string;
  documentId: string;
};

/** Server function to confirm that document upload completed and transition status to 'awaiting_verification' */
export const confirmDocumentUpload = createServerFn({ method: "POST" })
  .inputValidator((input: ConfirmDocumentUploadInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const documentId = String(input?.documentId ?? "").trim();

    if (!studentId || !documentId) {
      throw new Error("400 Bad Request: studentId and documentId are required.");
    }

    return { studentId, documentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Role verification
    if (authCtx.role === "student") {
      if (authCtx.user.email.toLowerCase() !== resolvedStudent.email.toLowerCase()) {
        throw new Error("403 Forbidden: You can only access your own documents.");
      }
    } else if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to access this student.");
      }
    } else if (authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Unauthorized role.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch document metadata record
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("id", data.documentId)
      .maybeSingle();

    if (fetchError || !doc) {
      throw new Error(`404 Not Found: Document record '${data.documentId}' not found.`);
    }

    if (doc.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Document does not belong to target student.");
    }

    const nowIso = new Date().toISOString();

    // Update status to awaiting_verification and clear rejection_reason
    const { error: updateError } = await supabaseAdmin
      .from("student_documents")
      .update({
        status: "awaiting_verification",
        rejection_reason: null,
        updated_at: nowIso,
      })
      .eq("id", data.documentId);

    if (updateError) {
      console.error("Failed to confirm document upload status:", updateError.message);
      throw new Error(`500 Internal Server Error: Failed to confirm upload status.`);
    }

    // Record tracking history
    const { documentTypeLabels } = await import("@/lib/student-documents");
    const docLabel = documentTypeLabels[doc.doc_type || ""] || doc.original_filename;
    const actionText = doc.status === "rejected" ? "re-uploaded" : "uploaded";

    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: resolvedStudent.id,
      stage: "documents",
      changed_by_counsellor_id: authCtx.role !== "student" ? authCtx.user.id : null,
      changed_by_counsellor_name: authCtx.role !== "student" ? authCtx.user.email : "Student",
      notes: `${docLabel} ${actionText} and awaiting verification.`,
      created_at: nowIso,
    });

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, documentId: data.documentId, status: "awaiting_verification" };
  });

export type VerifyStudentDocumentInput = {
  studentId: string;
  documentId: string;
};

/** Server function for counsellor/admin to verify a student document */
export const verifyStudentDocument = createServerFn({ method: "POST" })
  .inputValidator((input: VerifyStudentDocumentInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const documentId = String(input?.documentId ?? "").trim();
    if (!studentId || !documentId) {
      throw new Error("400 Bad Request: studentId and documentId are required.");
    }
    return { studentId, documentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor or Admin access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to manage documents for this student.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch document metadata record
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("id", data.documentId)
      .maybeSingle();

    if (fetchError || !doc) {
      throw new Error(`404 Not Found: Document record '${data.documentId}' not found.`);
    }

    if (doc.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Document does not belong to target student.");
    }

    let counsellorId: string | null = null;
    let counsellorName: string = authCtx.user.email;

    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id, full_name")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    if (cRow) {
      counsellorId = cRow.id;
      counsellorName = cRow.full_name || authCtx.user.email;
    }

    const nowIso = new Date().toISOString();

    // Update status to verified
    const { error: updateError } = await supabaseAdmin
      .from("student_documents")
      .update({
        status: "verified",
        rejection_reason: null,
        verified_at: nowIso,
        verified_by_counsellor_id: counsellorId,
        verified_by_counsellor_name: counsellorName,
        updated_at: nowIso,
      })
      .eq("id", data.documentId);

    if (updateError) {
      console.error("Failed to verify document:", updateError.message);
      throw new Error(`500 Internal Server Error: Failed to verify document.`);
    }

    // Record activity in student_tracking_history
    const { documentTypeLabels } = await import("@/lib/student-documents");
    const docLabel = documentTypeLabels[doc.doc_type || ""] || doc.original_filename;

    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: resolvedStudent.id,
      stage: "documents",
      changed_by_counsellor_id: counsellorId,
      changed_by_counsellor_name: counsellorName,
      notes: `${docLabel} verified by counsellor.`,
      created_at: nowIso,
    });

    // Emit notification to student
    if (resolvedStudent.id) {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: resolvedStudent.id,
        recipientRole: "student",
        type: "document_verified",
        title: "Document Verified",
        message: `Your ${docLabel} has been verified by your counsellor.`,
        studentId: resolvedStudent.id,
        entityType: "document",
        entityId: data.documentId,
      });
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, documentId: data.documentId, status: "verified" };
  });

export type RejectStudentDocumentInput = {
  studentId: string;
  documentId: string;
  rejectionReason: string;
};

/** Server function for counsellor/admin to reject a student document with mandatory reason */
export const rejectStudentDocument = createServerFn({ method: "POST" })
  .inputValidator((input: RejectStudentDocumentInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const documentId = String(input?.documentId ?? "").trim();
    const rejectionReason = String(input?.rejectionReason ?? "").trim();

    if (!studentId || !documentId) {
      throw new Error("400 Bad Request: studentId and documentId are required.");
    }
    if (!rejectionReason || rejectionReason.length < 3) {
      throw new Error("400 Bad Request: Rejection reason is required (minimum 3 characters).");
    }

    return { studentId, documentId, rejectionReason };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor or Admin access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to manage documents for this student.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch document metadata record
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("id", data.documentId)
      .maybeSingle();

    if (fetchError || !doc) {
      throw new Error(`404 Not Found: Document record '${data.documentId}' not found.`);
    }

    if (doc.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Document does not belong to target student.");
    }

    let counsellorId: string | null = null;
    let counsellorName: string = authCtx.user.email;

    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id, full_name")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    if (cRow) {
      counsellorId = cRow.id;
      counsellorName = cRow.full_name || authCtx.user.email;
    }

    const nowIso = new Date().toISOString();

    // Update status to rejected
    const { error: updateError } = await supabaseAdmin
      .from("student_documents")
      .update({
        status: "rejected",
        rejection_reason: data.rejectionReason,
        updated_at: nowIso,
      })
      .eq("id", data.documentId);

    if (updateError) {
      console.error("Failed to reject document:", updateError.message);
      throw new Error(`500 Internal Server Error: Failed to reject document.`);
    }

    // Record activity in student_tracking_history
    const { documentTypeLabels } = await import("@/lib/student-documents");
    const docLabel = documentTypeLabels[doc.doc_type || ""] || doc.original_filename;

    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: resolvedStudent.id,
      stage: "documents",
      changed_by_counsellor_id: counsellorId,
      changed_by_counsellor_name: counsellorName,
      notes: `${docLabel} rejected. Reason: ${data.rejectionReason}`,
      created_at: nowIso,
    });

    // Emit notification to student
    if (resolvedStudent.id) {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: resolvedStudent.id,
        recipientRole: "student",
        type: "document_rejected",
        title: "Document Action Required",
        message: `Your ${docLabel} document requires action. Reason: ${data.rejectionReason}`,
        studentId: resolvedStudent.id,
        entityType: "document",
        entityId: data.documentId,
      });
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, documentId: data.documentId, status: "rejected" };
  });

export type GetDocumentDownloadUrlInput = {
  studentId: string;
  documentId: string;
};

/** Server function to generate a short-lived signed URL for viewing/downloading a document */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: GetDocumentDownloadUrlInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const documentId = String(input?.documentId ?? "").trim();

    if (!studentId || !documentId) {
      throw new Error("400 Bad Request: studentId and documentId are required.");
    }

    return { studentId, documentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to view this document.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("id", data.documentId)
      .maybeSingle();

    if (fetchError || !doc) {
      throw new Error(`404 Not Found: Document record '${data.documentId}' not found.`);
    }

    if (doc.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Document does not belong to target student.");
    }

    if (doc.status !== "uploaded") {
      throw new Error("400 Bad Request: Document is not in uploaded state.");
    }

    // Generate 60-second signed download URL
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("student-documents")
      .createSignedUrl(doc.storage_path, 60, { download: doc.original_filename });

    if (signedError || !signedData) {
      console.error("Failed to generate signed download URL:", signedError?.message);
      throw new Error(`500 Internal Server Error: Failed to generate secure access URL.`);
    }

    return {
      signedUrl: signedData.signedUrl,
      filename: doc.original_filename,
    };
  });

export type DeleteStudentDocumentInput = {
  studentId: string;
  documentId: string;
};

/** Server function to safely delete a student document (storage deletion first, metadata second) */
export const deleteStudentDocument = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteStudentDocumentInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const documentId = String(input?.documentId ?? "").trim();

    if (!studentId || !documentId) {
      throw new Error("400 Bad Request: studentId and documentId are required.");
    }

    return { studentId, documentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to delete this document.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch document metadata
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from("student_documents")
      .select("*")
      .eq("id", data.documentId)
      .maybeSingle();

    if (fetchError || !doc) {
      throw new Error(`404 Not Found: Document record '${data.documentId}' not found.`);
    }

    if (doc.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Document does not belong to target student.");
    }

    // Step 1: Remove storage object first
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from("student-documents")
      .remove([doc.storage_path]);

    if (storageDeleteError) {
      console.error("Storage object deletion failed:", storageDeleteError.message);
      // DO NOT delete metadata row if storage deletion fails
      throw new Error(`500 Storage Deletion Failure: ${storageDeleteError.message}. Metadata preserved.`);
    }

    // Step 2: Delete metadata row only after successful storage removal
    const { error: dbDeleteError } = await supabaseAdmin
      .from("student_documents")
      .delete()
      .eq("id", data.documentId);

    if (dbDeleteError) {
      console.error("Metadata row deletion failed after storage removal:", dbDeleteError.message);
      throw new Error(`500 Database Deletion Failure: ${dbDeleteError.message}`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, documentId: data.documentId };
  });

/* ------------------------------------------------------------------ */
/* Phase 4: Student Tasks & Follow-ups Server Functions               */
/* ------------------------------------------------------------------ */

export type CreateTaskInput = {
  studentId: string;
  title: string;
  description?: string | null;
  category?: string;
  priority?: string;
  dueAt?: string | null;
};

/** Server function to create a new task/follow-up for an authorized student */
export const createStudentTask = createServerFn({ method: "POST" })
  .inputValidator((input: CreateTaskInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const title = String(input?.title ?? "").trim();
    const description = input?.description != null ? String(input.description).trim() : null;
    const category = String(input?.category ?? "other").trim().toLowerCase();
    const priority = String(input?.priority ?? "normal").trim().toLowerCase();
    const dueAt = input?.dueAt ? String(input.dueAt).trim() : null;

    if (!studentId) {
      throw new Error("400 Bad Request: studentId is required.");
    }

    const { validateTaskInput } = require("@/lib/student-tasks");
    const val = validateTaskInput(title, priority, category);
    if (!val.valid) {
      throw new Error(`400 Bad Request: ${val.error}`);
    }

    return { studentId, title, description, category, priority, dueAt };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor scoping
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to create tasks for this student.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve creator/assigned counsellor ID
    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    if (!cRow && authCtx.role === "counsellor") {
      throw new Error("403 Forbidden: Counsellor record not found in system roster.");
    }

    const counsellorId = cRow?.id || authCtx.user.id;

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("student_tasks")
      .insert({
        student_id: resolvedStudent.id,
        assigned_to_counsellor_id: counsellorId,
        created_by_counsellor_id: counsellorId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "pending",
        due_at: data.dueAt || null,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error("Failed to create student task:", insertError?.message);
      throw new Error(`500 Internal Server Error: Could not create task.`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Log tracking history event
    try {
      await supabaseAdmin.from("student_tracking_history").insert({
        student_id: resolvedStudent.id,
        stage: "follow_up",
        changed_by_counsellor_id: counsellorId,
        changed_by_counsellor_name: authCtx.user.name || authCtx.user.email,
        notes: `📋 Follow-up task created: "${data.title}"`,
        created_at: new Date().toISOString(),
      });
    } catch (trackErr) {
      console.warn("[TRACK_LOG_CREATE_TASK_WARN]", trackErr);
    }

    // Isolated notification emission (after commit)
    try {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: authCtx.user.id,
        recipientRole: (authCtx.role as any) ?? "counsellor",
        type: "task.assigned",
        title: "New Task Created",
        message: `Task assigned: "${data.title}"`,
        entityType: "task",
        entityId: inserted.id,
        studentId: resolvedStudent.id,
      });

      if (data.category === "documents" || data.category === "student" || data.priority === "urgent" || data.priority === "high") {
        await emitNotification({
          recipientUserId: resolvedStudent.id,
          recipientRole: "student",
          type: "action_required",
          title: "Action Required",
          message: `Please review task: "${data.title}"`,
          entityType: "task",
          entityId: inserted.id,
          studentId: resolvedStudent.id,
        });
      }
    } catch (notifErr) {
      console.warn("[NOTIF_EMIT_CREATE_TASK_WARN]", notifErr);
    }

    return { success: true, taskId: inserted.id };
  });

export type UpdateTaskStatusInput = {
  taskId: string;
  studentId: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
};

/** Server function to update a task's status (pending, in_progress, completed, cancelled) */
export const updateStudentTaskStatus = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateTaskStatusInput) => {
    const taskId = String(input?.taskId ?? "").trim();
    const studentId = String(input?.studentId ?? "").trim();
    const status = String(input?.status ?? "").trim().toLowerCase() as any;

    if (!taskId || !studentId) {
      throw new Error("400 Bad Request: taskId and studentId are required.");
    }

    if (!["pending", "in_progress", "completed", "cancelled"].includes(status)) {
      throw new Error(`400 Bad Request: Invalid status '${status}'.`);
    }

    return { taskId, studentId, status };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing task record
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("student_tasks")
      .select("*")
      .eq("id", data.taskId)
      .maybeSingle();

    if (fetchError || !existingTask) {
      throw new Error(`404 Not Found: Task '${data.taskId}' not found.`);
    }

    if (existingTask.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Task does not belong to target student.");
    }

    // Verify task ownership for ordinary counsellors
    let counsellorId: string | null = null;
    if (authCtx.role === "counsellor") {
      const { data: cRow } = await supabaseAdmin
        .from("counsellors")
        .select("id")
        .ilike("email", authCtx.user.email)
        .maybeSingle();

      counsellorId = cRow?.id ?? null;

      const isOwner =
        counsellorId &&
        (existingTask.assigned_to_counsellor_id === counsellorId ||
          existingTask.created_by_counsellor_id === counsellorId);

      if (!isOwner) {
        throw new Error("403 Forbidden: You can only update tasks assigned to or created by you.");
      }
    }

    const isCompleting = data.status === "completed";
    const isReopening = existingTask.status === "completed" && data.status !== "completed";

    const updatePayload: Record<string, any> = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (isCompleting) {
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.completed_by_counsellor_id = counsellorId;
    } else if (isReopening) {
      updatePayload.completed_at = null;
      updatePayload.completed_by_counsellor_id = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("student_tasks")
      .update(updatePayload)
      .eq("id", data.taskId);

    if (updateError) {
      console.error("Failed to update task status:", updateError.message);
      throw new Error("500 Internal Server Error: Failed to update task status.");
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Log tracking history event for task status change
    try {
      const statusIcon =
        data.status === "completed"
          ? "✓"
          : data.status === "in_progress"
          ? "▶"
          : data.status === "cancelled"
          ? "🚫"
          : "🔄";
      const statusAction =
        data.status === "completed"
          ? "completed"
          : data.status === "in_progress"
          ? "started"
          : data.status === "cancelled"
          ? "cancelled"
          : "reopened";

      await supabaseAdmin.from("student_tracking_history").insert({
        student_id: resolvedStudent.id,
        stage: "follow_up",
        changed_by_counsellor_id: counsellorId,
        changed_by_counsellor_name: authCtx.user.name || authCtx.user.email,
        notes: `${statusIcon} Follow-up ${statusAction}: "${existingTask.title}"`,
        created_at: new Date().toISOString(),
      });
    } catch (trackErr) {
      console.warn("[TRACK_LOG_UPDATE_TASK_WARN]", trackErr);
    }

    return { success: true, taskId: data.taskId, status: data.status };
  });

export type UpdateTaskInput = {
  taskId: string;
  studentId: string;
  title?: string;
  description?: string | null;
  category?: string;
  priority?: string;
  dueAt?: string | null;
};

/** Server function to update a task's details (title, description, category, priority, dueAt) */
export const updateStudentTask = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateTaskInput) => {
    const taskId = String(input?.taskId ?? "").trim();
    const studentId = String(input?.studentId ?? "").trim();
    const title = input?.title != null ? String(input.title).trim() : undefined;
    const description = input?.description !== undefined ? (input.description ? String(input.description).trim() : null) : undefined;
    const category = input?.category != null ? String(input.category).trim().toLowerCase() : undefined;
    const priority = input?.priority != null ? String(input.priority).trim().toLowerCase() : undefined;
    const dueAt = input?.dueAt !== undefined ? (input.dueAt ? String(input.dueAt).trim() : null) : undefined;

    if (!taskId || !studentId) {
      throw new Error("400 Bad Request: taskId and studentId are required.");
    }

    if (title !== undefined && !title) {
      throw new Error("400 Bad Request: Task title cannot be empty.");
    }

    return { taskId, studentId, title, description, category, priority, dueAt };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch existing task
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("student_tasks")
      .select("*")
      .eq("id", data.taskId)
      .maybeSingle();

    if (fetchError || !existingTask) {
      throw new Error(`404 Not Found: Task '${data.taskId}' not found.`);
    }

    if (existingTask.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Task does not belong to target student.");
    }

    // Verify task ownership for ordinary counsellors
    let counsellorId: string | null = null;
    if (authCtx.role === "counsellor") {
      const { data: cRow } = await supabaseAdmin
        .from("counsellors")
        .select("id")
        .ilike("email", authCtx.user.email)
        .maybeSingle();

      counsellorId = cRow?.id ?? null;

      const isOwner =
        counsellorId &&
        (existingTask.assigned_to_counsellor_id === counsellorId ||
          existingTask.created_by_counsellor_id === counsellorId);

      if (!isOwner) {
        throw new Error("403 Forbidden: You can only update tasks assigned to or created by you.");
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.dueAt !== undefined) updatePayload.due_at = data.dueAt;

    const { error: updateError } = await supabaseAdmin
      .from("student_tasks")
      .update(updatePayload)
      .eq("id", data.taskId);

    if (updateError) {
      console.error("Failed to update task details:", updateError.message);
      throw new Error("500 Internal Server Error: Failed to update task details.");
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    try {
      await supabaseAdmin.from("student_tracking_history").insert({
        student_id: resolvedStudent.id,
        stage: "follow_up",
        changed_by_counsellor_id: counsellorId,
        changed_by_counsellor_name: authCtx.user.name || authCtx.user.email,
        notes: `✏ Follow-up task updated: "${data.title || existingTask.title}"`,
        created_at: new Date().toISOString(),
      });
    } catch (trackErr) {
      console.warn("[TRACK_LOG_EDIT_TASK_WARN]", trackErr);
    }

    return { success: true, taskId: data.taskId };
  });

export type DeleteTaskInput = {
  taskId: string;
  studentId: string;
};

/** Server function to delete a student task (only owner or super_admin) */
export const deleteStudentTask = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteTaskInput) => {
    const taskId = String(input?.taskId ?? "").trim();
    const studentId = String(input?.studentId ?? "").trim();

    if (!taskId || !studentId) {
      throw new Error("400 Bad Request: taskId and studentId are required.");
    }

    return { taskId, studentId };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("student_tasks")
      .select("*")
      .eq("id", data.taskId)
      .maybeSingle();

    if (fetchError || !existingTask) {
      throw new Error(`404 Not Found: Task '${data.taskId}' not found.`);
    }

    if (existingTask.student_id !== resolvedStudent.id) {
      throw new Error("403 Forbidden: Task does not belong to target student.");
    }

    // Verify task ownership for ordinary counsellors
    if (authCtx.role === "counsellor") {
      const { data: cRow } = await supabaseAdmin
        .from("counsellors")
        .select("id")
        .ilike("email", authCtx.user.email)
        .maybeSingle();

      const counsellorId = cRow?.id ?? null;
      const isOwner =
        counsellorId &&
        (existingTask.assigned_to_counsellor_id === counsellorId ||
          existingTask.created_by_counsellor_id === counsellorId);

      if (!isOwner) {
        throw new Error("403 Forbidden: You can only delete tasks assigned to or created by you.");
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("student_tasks")
      .delete()
      .eq("id", data.taskId);

    if (deleteError) {
      console.error("Failed to delete task:", deleteError.message);
      throw new Error("500 Internal Server Error: Failed to delete task.");
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true, taskId: data.taskId };
  });

/** Server function to fetch tasks across assigned students for the Counsellor Dashboard */
export const getCounsellorDashboardTasksData = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { sessions: allSessions } = await loadSessions();
    const { profiles } = await loadStudentProfiles();

    let authorizedStudents: StudentProfile[] = [];
    if (authCtx.role === "super_admin") {
      authorizedStudents = compose(allSessions, profiles);
    } else {
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      authorizedStudents = compose(counsellorSessions, profiles);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch counsellor record
    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id")
      .ilike("email", authCtx.user.email)
      .maybeSingle();

    const counsellorId = cRow?.id || "";

    const emails = authorizedStudents.map((s) => s.email.toLowerCase());
    const { data: dbStudents } = await supabaseAdmin
      .from("students")
      .select("id, email")
      .in("email", emails);

    const authorizedStudentIds = (dbStudents ?? []).map((s) => s.id);

    const { fetchCounsellorTasksData } = await import("@/lib/portal-supabase.server");
    const { tasks } = await fetchCounsellorTasksData(counsellorId, authorizedStudentIds);

    return { tasks };
  });

/* ------------------------------------------------------------------ */
/* Phase 5: Student Shortlists, Applications & Offers Server Functions*/
/* ------------------------------------------------------------------ */

export const getUniversities = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx) throw new Error("401 Unauthorized: Valid login required.");
    const { fetchUniversitiesData } = await import("@/lib/portal-supabase.server");
    return fetchUniversitiesData();
  });

export type CreateUniversityInput = {
  name: string;
  country: string;
  city?: string | null;
  websiteUrl?: string | null;
};

export const createUniversity = createServerFn({ method: "POST" })
  .inputValidator((input: CreateUniversityInput) => {
    const name = String(input?.name ?? "").trim();
    const country = String(input?.country ?? "").trim();
    if (!name) throw new Error("400 Bad Request: University name is required.");
    if (!country) throw new Error("400 Bad Request: Country is required.");
    return {
      name,
      country,
      city: input?.city ? String(input.city).trim() : null,
      websiteUrl: input?.websiteUrl ? String(input.websiteUrl).trim() : null,
    };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }
    const { normalizeUniversityName } = await import("@/lib/student-applications");
    const normalizedName = normalizeUniversityName(data.name);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("universities")
      .select("id, name, country, city, website_url, created_at")
      .ilike("name", normalizedName)
      .ilike("country", data.country)
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        country: existing.country,
        city: existing.city ?? null,
        websiteUrl: existing.website_url ?? null,
        createdAt: existing.created_at,
      };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("universities")
      .insert({
        name: normalizedName,
        country: data.country,
        city: data.city,
        website_url: data.websiteUrl,
      })
      .select("id, name, country, city, website_url, created_at")
      .single();

    if (error || !inserted) {
      throw new Error(`500 Internal Server Error: Failed to create university (${error?.message}).`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return {
      id: inserted.id,
      name: inserted.name,
      country: inserted.country,
      city: inserted.city ?? null,
      websiteUrl: inserted.website_url ?? null,
      createdAt: inserted.created_at,
    };
  });

export type CreateShortlistInput = {
  studentId: string;
  universityId?: string;
  universityName?: string;
  universityCountry?: string;
  universityCity?: string | null;
  courseName: string;
  degreeLevel: string;
  intake: string;
  category?: import("@/lib/student-applications").ShortlistCategory;
  notes?: string | null;
};

export const createShortlist = createServerFn({ method: "POST" })
  .inputValidator((input: CreateShortlistInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const courseName = String(input?.courseName ?? "").trim();
    const degreeLevel = String(input?.degreeLevel ?? "").trim();
    const intake = String(input?.intake ?? "").trim();

    if (!studentId) throw new Error("400 Bad Request: studentId is required.");
    if (!courseName) throw new Error("400 Bad Request: courseName is required.");
    if (!degreeLevel) throw new Error("400 Bad Request: degreeLevel is required.");
    if (!intake) throw new Error("400 Bad Request: intake is required.");

    return {
      studentId,
      universityId: input?.universityId ? String(input.universityId).trim() : undefined,
      universityName: input?.universityName ? String(input.universityName).trim() : undefined,
      universityCountry: input?.universityCountry ? String(input.universityCountry).trim() : undefined,
      universityCity: input?.universityCity ? String(input.universityCity).trim() : null,
      courseName,
      degreeLevel,
      intake,
      category: input?.category || "target",
      notes: input?.notes ? String(input.notes).trim() : null,
    };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const resolved = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolved) throw new Error("404 Not Found: Student does not exist.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (authCtx.role !== "super_admin") {
      const { sessions } = await loadSessions();
      const isAssigned = sessions.some(
        (s) => s.counsellorEmail === authCtx.user.email && (s.studentId === resolved.id || s.studentEmail.toLowerCase() === resolved.email.toLowerCase())
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    const { data: cRow } = await supabaseAdmin
      .from("counsellors")
      .select("id")
      .ilike("email", authCtx.user.email)
      .maybeSingle();
    const counsellorId = cRow?.id || null;

    let targetUniId = data.universityId;
    if (!targetUniId && data.universityName && data.universityCountry) {
      const { normalizeUniversityName } = await import("@/lib/student-applications");
      const normName = normalizeUniversityName(data.universityName);
      const { data: existingUni } = await supabaseAdmin
        .from("universities")
        .select("id")
        .ilike("name", normName)
        .ilike("country", data.universityCountry)
        .maybeSingle();

      if (existingUni) {
        targetUniId = existingUni.id;
      } else {
        const { data: newUni } = await supabaseAdmin
          .from("universities")
          .insert({
            name: normName,
            country: data.universityCountry,
            city: data.universityCity,
          })
          .select("id")
          .single();
        if (newUni) targetUniId = newUni.id;
      }
    }

    if (!targetUniId) {
      throw new Error("400 Bad Request: University must be specified.");
    }

    const { data: dup } = await supabaseAdmin
      .from("student_shortlists")
      .select("id")
      .eq("student_id", resolved.id)
      .eq("university_id", targetUniId)
      .ilike("course_name", data.courseName)
      .ilike("intake", data.intake)
      .maybeSingle();

    if (dup) {
      throw new Error("400 Bad Request: Duplicate shortlist entry already exists for this university, course, and intake.");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("student_shortlists")
      .insert({
        student_id: resolved.id,
        university_id: targetUniId,
        course_name: data.courseName,
        degree_level: data.degreeLevel,
        intake: data.intake,
        category: data.category,
        status: "considering",
        notes: data.notes,
        created_by_counsellor_id: counsellorId,
        updated_by_counsellor_id: counsellorId,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`500 Internal Server Error: Failed to create shortlist (${error?.message}).`);
    }

    // Log tracking history event
    const uniName = data.universityName || (await supabaseAdmin.from("universities").select("name").eq("id", targetUniId).maybeSingle()).data?.name || "University";
    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: resolved.id,
      actor_role: authCtx.role,
      actor_id: authCtx.user.id,
      event_type: "university_shortlisted",
      description: `🎓 Shortlisted ${uniName} for ${data.courseName} (${data.intake}).`,
    });

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Notify student
    try {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: resolved.id,
        recipientRole: "student",
        type: "university.shortlisted",
        title: "University Shortlisted",
        message: `🎓 ${uniName} (${data.courseName}) has been added to your shortlist.`,
        entityType: "shortlist",
        entityId: inserted.id,
        studentId: resolved.id,
      });
    } catch (notifErr) {
      console.warn("[NOTIF_EMIT_SHORTLIST_WARN]", notifErr);
    }

    return { id: inserted.id };
  });

export type UpdateShortlistStatusInput = {
  shortlistId: string;
  status: import("@/lib/student-applications").ShortlistStatus;
  category?: import("@/lib/student-applications").ShortlistCategory;
  notes?: string | null;
};

export const updateShortlistStatus = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateShortlistStatusInput) => {
    const shortlistId = String(input?.shortlistId ?? "").trim();
    if (!shortlistId) throw new Error("400 Bad Request: shortlistId is required.");
    return {
      shortlistId,
      status: input.status,
      category: input.category,
      notes: input.notes != null ? String(input.notes).trim() : undefined,
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: shortlist } = await supabaseAdmin
      .from("student_shortlists")
      .select("id, student_id, course_name, universities(name)")
      .eq("id", data.shortlistId)
      .single();

    if (!shortlist) throw new Error("404 Not Found: Shortlist entry not found.");

    if (authCtx.role !== "super_admin") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", shortlist.student_id).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    const { data: cRow } = await supabaseAdmin.from("counsellors").select("id").ilike("email", authCtx.user.email).maybeSingle();
    const counsellorId = cRow?.id || null;

    const updates: Record<string, any> = {
      status: data.status,
      updated_by_counsellor_id: counsellorId,
      updated_at: new Date().toISOString(),
    };
    if (data.category) updates['category'] = data.category;
    if (data.notes !== undefined) updates['notes'] = data.notes;

    const { error } = await supabaseAdmin.from("student_shortlists").update(updates as any).eq("id", data.shortlistId);
    if (error) throw new Error(`500 Internal Server Error: Failed to update shortlist (${error.message}).`);

    const uniName = (shortlist as any).universities?.name || "University";
    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: shortlist.student_id,
      actor_role: authCtx.role,
      actor_id: authCtx.user.id,
      event_type: "shortlist_updated",
      description: `🎓 Shortlist status updated to ${data.status} for ${uniName}.`,
    });

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true };
  });

export type CreateApplicationFromShortlistInput = {
  shortlistId: string;
  applicationNumber?: string | null;
  applicationDeadline?: string | null;
  notes?: string | null;
};

export const createApplicationFromShortlist = createServerFn({ method: "POST" })
  .inputValidator((input: CreateApplicationFromShortlistInput) => {
    const shortlistId = String(input?.shortlistId ?? "").trim();
    if (!shortlistId) throw new Error("400 Bad Request: shortlistId is required.");
    return {
      shortlistId,
      applicationNumber: input?.applicationNumber ? String(input.applicationNumber).trim() : null,
      applicationDeadline: input?.applicationDeadline ? String(input.applicationDeadline).trim() : null,
      notes: input?.notes ? String(input.notes).trim() : null,
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: shortlist, error: slError } = await supabaseAdmin
      .from("student_shortlists")
      .select("*, universities(name)")
      .eq("id", data.shortlistId)
      .single();

    if (slError || !shortlist) {
      throw new Error("404 Not Found: Shortlist option not found.");
    }

    if (authCtx.role !== "super_admin") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", shortlist.student_id).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    const { data: cRow } = await supabaseAdmin.from("counsellors").select("id").ilike("email", authCtx.user.email).maybeSingle();
    const counsellorId = cRow?.id || null;

    const { data: dupApp } = await supabaseAdmin
      .from("student_applications")
      .select("id")
      .eq("student_id", shortlist.student_id)
      .eq("university_id", shortlist.university_id)
      .ilike("course_name", shortlist.course_name)
      .ilike("intake", shortlist.intake)
      .maybeSingle();

    if (dupApp) {
      throw new Error("400 Bad Request: An application already exists for this university, course, and intake.");
    }

    const { data: insertedApp, error: appError } = await supabaseAdmin
      .from("student_applications")
      .insert({
        student_id: shortlist.student_id,
        shortlist_id: shortlist.id,
        university_id: shortlist.university_id,
        course_name: shortlist.course_name,
        degree_level: shortlist.degree_level,
        intake: shortlist.intake,
        application_number: data.applicationNumber,
        status: "preparing",
        application_deadline: data.applicationDeadline,
        notes: data.notes || shortlist.notes,
        created_by_counsellor_id: counsellorId,
        updated_by_counsellor_id: counsellorId,
      })
      .select("id")
      .single();

    if (appError || !insertedApp) {
      throw new Error(`500 Internal Server Error: Failed to create application (${appError?.message}).`);
    }

    await supabaseAdmin
      .from("student_shortlists")
      .update({
        status: "applying",
        updated_by_counsellor_id: counsellorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shortlist.id);

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { id: insertedApp.id };
  });

export type UpdateApplicationStatusInput = {
  applicationId: string;
  status: import("@/lib/student-applications").ApplicationStatus;
  submissionDate?: string | null;
  applicationDeadline?: string | null;
  applicationNumber?: string | null;
  notes?: string | null;
};

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateApplicationStatusInput) => {
    const applicationId = String(input?.applicationId ?? "").trim();
    if (!applicationId) throw new Error("400 Bad Request: applicationId is required.");
    return {
      applicationId,
      status: input.status,
      submissionDate: input?.submissionDate ? String(input.submissionDate).trim() : undefined,
      applicationDeadline: input?.applicationDeadline ? String(input.applicationDeadline).trim() : undefined,
      applicationNumber: input?.applicationNumber ? String(input.applicationNumber).trim() : undefined,
      notes: input?.notes != null ? String(input.notes).trim() : undefined,
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("student_applications").select("id, student_id, status").eq("id", data.applicationId).single();
    if (!app) throw new Error("404 Not Found: Application not found.");

    if (authCtx.role !== "super_admin") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", app.student_id).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    if (data.status === "decision_received") {
      const { data: offer } = await supabaseAdmin.from("student_offers").select("id").eq("application_id", data.applicationId).maybeSingle();
      if (!offer) {
        throw new Error("400 Bad Request: Please record offer/decision details first before updating status to Decision Received.");
      }
    }

    const { data: cRow } = await supabaseAdmin.from("counsellors").select("id").ilike("email", authCtx.user.email).maybeSingle();
    const counsellorId = cRow?.id || null;

    const updates: Record<string, any> = {
      status: data.status,
      updated_by_counsellor_id: counsellorId,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "submitted" && !data.submissionDate) {
      updates['submission_date'] = new Date().toISOString();
    } else if (data.submissionDate !== undefined) {
      updates['submission_date'] = data.submissionDate;
    }
    if (data.applicationDeadline !== undefined) updates['application_deadline'] = data.applicationDeadline;
    if (data.applicationNumber !== undefined) updates['application_number'] = data.applicationNumber;
    if (data.notes !== undefined) updates['notes'] = data.notes;

    const { error } = await supabaseAdmin.from("student_applications").update(updates as any).eq("id", data.applicationId);
    if (error) throw new Error(`500 Internal Server Error: Failed to update application (${error.message}).`);

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Isolated notification emission (after commit)
    try {
      const { emitNotification } = await import("@/lib/notifications.server");
      const notifType = data.status === "action_required" ? "app.action_required" : "app.status_changed";
      await emitNotification({
        recipientUserId: authCtx.user.id,
        recipientRole: (authCtx.role as any) ?? "counsellor",
        type: notifType,
        title: data.status === "action_required" ? "Action Required on Application" : "Application Status Updated",
        message: `Application status moved to ${data.status.replace("_", " ")}.`,
        entityType: "application",
        entityId: data.applicationId,
        studentId: app.student_id,
      });
    } catch (notifErr) {
      console.warn("[NOTIF_EMIT_APP_STATUS_WARN]", notifErr);
    }

    return { success: true };
  });

export type RecordApplicationDecisionInput = {
  applicationId: string;
  offerType: import("@/lib/student-applications").OfferType;
  conditions?: string | null;
  depositRequired?: boolean;
  depositAmount?: number | null;
  depositDeadline?: string | null;
  offerLetterDocumentId?: string | null;
  decisionStatus?: import("@/lib/student-applications").OfferDecisionStatus;
  decisionDate?: string | null;
};

export const recordApplicationDecision = createServerFn({ method: "POST" })
  .inputValidator((input: RecordApplicationDecisionInput) => {
    const applicationId = String(input?.applicationId ?? "").trim();
    if (!applicationId) throw new Error("400 Bad Request: applicationId is required.");
    return {
      applicationId,
      offerType: input.offerType,
      conditions: input?.conditions ? String(input.conditions).trim() : null,
      depositRequired: Boolean(input?.depositRequired),
      depositAmount: input?.depositAmount != null ? Number(input.depositAmount) : null,
      depositDeadline: input?.depositDeadline ? String(input.depositDeadline).trim() : null,
      offerLetterDocumentId: input?.offerLetterDocumentId ? String(input.offerLetterDocumentId).trim() : null,
      decisionStatus: input?.decisionStatus || "pending",
      decisionDate: input?.decisionDate ? String(input.decisionDate).trim() : new Date().toISOString(),
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app } = await supabaseAdmin.from("student_applications").select("id, student_id").eq("id", data.applicationId).single();
    if (!app) throw new Error("404 Not Found: Application not found.");

    if (authCtx.role !== "super_admin") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", app.student_id).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    if (data.offerLetterDocumentId) {
      const { data: doc } = await supabaseAdmin
        .from("student_documents")
        .select("id, student_id")
        .eq("id", data.offerLetterDocumentId)
        .maybeSingle();

      if (!doc) {
        throw new Error("404 Not Found: Offer letter document does not exist.");
      }
      if (doc.student_id !== app.student_id) {
        throw new Error("403 Forbidden: Document does not belong to this student.");
      }
    }

    const { data: cRow } = await supabaseAdmin.from("counsellors").select("id").ilike("email", authCtx.user.email).maybeSingle();
    const counsellorId = cRow?.id || null;

    const { error: offerError } = await supabaseAdmin
      .from("student_offers")
      .upsert(
        {
          application_id: data.applicationId,
          offer_type: data.offerType,
          conditions: data.conditions,
          deposit_required: data.depositRequired,
          deposit_amount: data.depositAmount,
          deposit_deadline: data.depositDeadline,
          offer_letter_document_id: data.offerLetterDocumentId,
          decision_status: data.decisionStatus,
          decision_date: data.decisionDate,
          created_by_counsellor_id: counsellorId,
          updated_by_counsellor_id: counsellorId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id" }
      );

    if (offerError) {
      throw new Error(`500 Internal Server Error: Failed to record offer decision (${offerError.message}).`);
    }

    await supabaseAdmin
      .from("student_applications")
      .update({
        status: "decision_received",
        updated_by_counsellor_id: counsellorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.applicationId);

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Isolated notification emission (after commit)
    try {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: authCtx.user.id,
        recipientRole: (authCtx.role as any) ?? "counsellor",
        type: "app.decision_recorded",
        title: "Application Decision Recorded",
        message: `Decision/offer recorded (${data.offerType}) for application.`,
        entityType: "application",
        entityId: data.applicationId,
        studentId: app.student_id,
      });
    } catch (notifErr) {
      console.warn("[NOTIF_EMIT_APP_DECISION_WARN]", notifErr);
    }

    return { success: true };
  });

export type UpdateOfferDecisionStatusInput = {
  offerId: string;
  decisionStatus: import("@/lib/student-applications").OfferDecisionStatus;
};

export const updateOfferDecisionStatus = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateOfferDecisionStatusInput) => {
    const offerId = String(input?.offerId ?? "").trim();
    if (!offerId) throw new Error("400 Bad Request: offerId is required.");
    return {
      offerId,
      decisionStatus: input.decisionStatus,
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx) throw new Error("401 Unauthorized: Valid login required.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: offer } = await supabaseAdmin
      .from("student_offers")
      .select("id, application_id, student_applications(student_id, universities(name))")
      .eq("id", data.offerId)
      .single();

    if (!offer) throw new Error("404 Not Found: Offer not found.");

    const studentId = (offer as any).student_applications?.student_id;
    const uniName = (offer as any).student_applications?.universities?.name || "University";

    if (authCtx.role === "student") {
      const resolvedStudent = await resolveOrCreateStudentUuid(authCtx.user.email);
      if (!resolvedStudent || resolvedStudent.id !== studentId) {
        throw new Error("403 Forbidden: You can only update decision for your own offer.");
      }
    } else if (authCtx.role === "counsellor") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", studentId).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("student_offers")
      .update({
        decision_status: data.decisionStatus,
        decision_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.offerId);

    if (updateError) {
      throw new Error(`500 Internal Server Error: Failed to update offer decision (${updateError.message}).`);
    }

    const actionText = data.decisionStatus === "accepted" ? "accepted" : data.decisionStatus === "declined" ? "declined" : data.decisionStatus;
    const icon = data.decisionStatus === "accepted" ? "✅" : "❌";

    await supabaseAdmin.from("student_tracking_history").insert({
      student_id: studentId,
      actor_role: authCtx.role,
      actor_id: authCtx.user.id,
      event_type: "offer_decision_updated",
      description: `${icon} Offer ${actionText} for ${uniName}.`,
    });

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return { success: true };
  });

export type CreateApplicationFollowUpTaskInput = {
  applicationId: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority?: import("@/lib/student-tasks").TaskPriority;
};

export const createApplicationFollowUpTask = createServerFn({ method: "POST" })
  .inputValidator((input: CreateApplicationFollowUpTaskInput) => {
    const applicationId = String(input?.applicationId ?? "").trim();
    const title = String(input?.title ?? "").trim();
    if (!applicationId) throw new Error("400 Bad Request: applicationId is required.");
    if (!title) throw new Error("400 Bad Request: Task title is required.");
    return {
      applicationId,
      title,
      description: input?.description ? String(input.description).trim() : null,
      dueAt: input?.dueAt ? String(input.dueAt).trim() : null,
      priority: input?.priority || "normal",
    };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app } = await supabaseAdmin.from("student_applications").select("id, student_id").eq("id", data.applicationId).single();
    if (!app) throw new Error("404 Not Found: Application not found.");

    if (authCtx.role !== "super_admin") {
      const { data: student } = await supabaseAdmin.from("students").select("id, email").eq("id", app.student_id).single();
      if (student) {
        const { sessions } = await loadSessions();
        const isAssigned = sessions.some((s) => s.counsellorEmail === authCtx.user.email && (s.studentId === student.id || s.studentEmail.toLowerCase() === student.email.toLowerCase()));
        if (!isAssigned) throw new Error("403 Forbidden: Student is not assigned to you.");
      }
    }

    const { data: cRow } = await supabaseAdmin.from("counsellors").select("id").ilike("email", authCtx.user.email).maybeSingle();
    const counsellorId = cRow?.id || null;
    if (!counsellorId) throw new Error("404 Not Found: Counsellor account record not found.");

    const { data: inserted, error } = await supabaseAdmin
      .from("student_tasks")
      .insert({
        student_id: app.student_id,
        assigned_to_counsellor_id: counsellorId,
        created_by_counsellor_id: counsellorId,
        title: data.title,
        description: data.description,
        category: "application",
        priority: data.priority,
        status: "pending",
        due_at: data.dueAt,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`500 Internal Server Error: Failed to create follow-up task (${error?.message}).`);
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    // Isolated notification emission (after commit)
    try {
      const { emitNotification } = await import("@/lib/notifications.server");
      await emitNotification({
        recipientUserId: authCtx.user.id,
        recipientRole: (authCtx.role as any) ?? "counsellor",
        type: "task.assigned",
        title: "New Follow-up Task",
        message: `Task assigned: "${data.title}"`,
        entityType: "task",
        entityId: inserted.id,
        studentId: app.student_id,
      });
    } catch (notifErr) {
      console.warn("[NOTIF_EMIT_TASK_WARN]", notifErr);
    }

    return { id: inserted.id };
  });

export const getCounsellorDashboardDeadlinesData = createServerFn({ method: "GET" })
  .inputValidator((input: { counsellorEmail: string }) => ({
    counsellorEmail: String(input?.counsellorEmail ?? "").trim(),
  }))
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request | undefined;
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);
    if (!authCtx || (authCtx.role !== "counsellor" && authCtx.role !== "super_admin")) {
      throw new Error("403 Forbidden: Counsellor access required.");
    }

    const { sessions: allSessions } = await loadSessions();
    const { profiles } = await loadStudentProfiles();

    let authorizedStudents: StudentProfile[] = [];
    if (authCtx.role === "super_admin") {
      authorizedStudents = compose(allSessions, profiles);
    } else {
      const counsellorSessions = allSessions.filter((s) => s.counsellorEmail === authCtx.user.email);
      authorizedStudents = compose(counsellorSessions, profiles);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emails = authorizedStudents.map((s) => s.email.toLowerCase());
    const { data: dbStudents } = await supabaseAdmin.from("students").select("id, email").in("email", emails);
    const authorizedStudentIds = (dbStudents ?? []).map((s) => s.id);

    const { fetchCounsellorDashboardDeadlinesData } = await import("@/lib/portal-supabase.server");
    return fetchCounsellorDashboardDeadlinesData(authorizedStudentIds);
  });

/* ------------------------------------------------------------------ */
/* Phase 6: Communication, Notifications & Operational Alerts        */
/* ------------------------------------------------------------------ */

export const getNotificationsList = createServerFn({ method: "GET" })
  .handler(async (ctx: any) => {
    const request = ctx.request as Request;
    const { fetchUserNotifications } = await import("@/lib/notifications.server");
    return fetchUserNotifications(request);
  });

export const getUnreadNotificationsCount = createServerFn({ method: "GET" })
  .handler(async (ctx: any) => {
    const request = ctx.request as Request;
    const { fetchUnreadNotificationCount } = await import("@/lib/notifications.server");
    return fetchUnreadNotificationCount(request);
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .inputValidator((input: { notificationId: string }) => {
    const notificationId = String(input?.notificationId ?? "").trim();
    if (!notificationId) throw new Error("400 Bad Request: notificationId is required.");
    return { notificationId };
  })
  .handler(async (ctx: any) => {
    const data = ctx.data;
    const request = ctx.request as Request;
    const { markNotificationAsRead } = await import("@/lib/notifications.server");
    const success = await markNotificationAsRead(request, data.notificationId);
    return { success };
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .handler(async (ctx: any) => {
    const request = ctx.request as Request;
    const { markAllNotificationsAsRead } = await import("@/lib/notifications.server");
    const success = await markAllNotificationsAsRead(request);
    return { success };
  });

/* ------------------------------------------------------------------ */
/* Core Student Profile Update                                        */
/* ------------------------------------------------------------------ */

export type UpdateStudentProfileInput = {
  studentId: string;
  fullName: string;
  phone?: string | null;
  currentDegree?: string | null;
  branch?: string | null;
  graduationYear?: string | null;
  cgpa?: string | null;
  preferredCountry?: string | null;
  preferredCourse?: string | null;
  preferredIntake?: string | null;
  englishTest?: string | null;
  budget?: string | null;
  additionalInfo?: string | null;
};

/**
 * Server function to update a student's core profile information.
 * Authorized for Super Admin (global scope) and assigned Counsellors.
 * Email is read-only and remains unchanged.
 */
export const updateStudentProfile = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateStudentProfileInput) => {
    const studentId = String(input?.studentId ?? "").trim();
    const fullName = String(input?.fullName ?? "").trim();

    if (!studentId) {
      throw new Error("400 Bad Request: studentId is required.");
    }
    if (!fullName || fullName.length < 2) {
      throw new Error("400 Bad Request: Full name must be at least 2 characters.");
    }
    if (fullName.length > 100) {
      throw new Error("400 Bad Request: Full name cannot exceed 100 characters.");
    }

    const phone = input?.phone != null ? String(input.phone).trim() : null;
    if (phone && phone.length > 30) {
      throw new Error("400 Bad Request: Phone number cannot exceed 30 characters.");
    }

    const currentDegree = input?.currentDegree != null ? String(input.currentDegree).trim() : null;
    if (currentDegree && currentDegree.length > 100) {
      throw new Error("400 Bad Request: Current degree cannot exceed 100 characters.");
    }

    const branch = input?.branch != null ? String(input.branch).trim() : null;
    if (branch && branch.length > 100) {
      throw new Error("400 Bad Request: Branch cannot exceed 100 characters.");
    }

    const graduationYear = input?.graduationYear != null ? String(input.graduationYear).trim() : null;
    if (graduationYear && graduationYear.length > 20) {
      throw new Error("400 Bad Request: Graduation year cannot exceed 20 characters.");
    }

    const cgpa = input?.cgpa != null ? String(input.cgpa).trim() : null;
    if (cgpa && cgpa.length > 50) {
      throw new Error("400 Bad Request: CGPA / percentage cannot exceed 50 characters.");
    }

    const preferredCountry = input?.preferredCountry != null ? String(input.preferredCountry).trim() : null;
    if (preferredCountry && preferredCountry.length > 100) {
      throw new Error("400 Bad Request: Preferred country cannot exceed 100 characters.");
    }

    const preferredCourse = input?.preferredCourse != null ? String(input.preferredCourse).trim() : null;
    if (preferredCourse && preferredCourse.length > 150) {
      throw new Error("400 Bad Request: Preferred course cannot exceed 150 characters.");
    }

    const preferredIntake = input?.preferredIntake != null ? String(input.preferredIntake).trim() : null;
    if (preferredIntake && preferredIntake.length > 50) {
      throw new Error("400 Bad Request: Preferred intake cannot exceed 50 characters.");
    }

    const englishTest = input?.englishTest != null ? String(input.englishTest).trim() : null;
    if (englishTest && englishTest.length > 100) {
      throw new Error("400 Bad Request: English test status cannot exceed 100 characters.");
    }

    const budget = input?.budget != null ? String(input.budget).trim() : null;
    if (budget && budget.length > 100) {
      throw new Error("400 Bad Request: Budget range cannot exceed 100 characters.");
    }

    const additionalInfo = input?.additionalInfo != null ? String(input.additionalInfo).trim() : null;
    if (additionalInfo && additionalInfo.length > 2000) {
      throw new Error("400 Bad Request: Additional info cannot exceed 2000 characters.");
    }

    return {
      studentId,
      fullName,
      phone,
      currentDegree,
      branch,
      graduationYear,
      cgpa,
      preferredCountry,
      preferredCourse,
      preferredIntake,
      englishTest,
      budget,
      additionalInfo,
    };
  })
  .handler(async ({ data, request }) => {
    const { getAuthenticatedContext } = await import("@/lib/server-auth");
    const authCtx = await getAuthenticatedContext(request);

    if (!authCtx) {
      throw new Error("401 Unauthorized: Valid login required.");
    }

    if (authCtx.role !== "counsellor" && authCtx.role !== "super_admin") {
      throw new Error("403 Forbidden: Counsellor or Super Admin access required.");
    }

    const resolvedStudent = await resolveOrCreateStudentUuid(data.studentId);
    if (!resolvedStudent) {
      throw new Error(`404 Not Found: Student '${data.studentId}' not found.`);
    }

    // Verify authorized counsellor assignment if role is counsellor
    if (authCtx.role === "counsellor") {
      const { sessions: allSessions } = await loadSessions();
      const counsellorSessions = allSessions.filter(
        (s) => s.counsellorEmail === authCtx.user.email,
      );
      const isAssigned = counsellorSessions.some(
        (s) =>
          (s.studentId && s.studentId === resolvedStudent.id) ||
          s.studentEmail.toLowerCase() === resolvedStudent.email.toLowerCase(),
      );
      if (!isAssigned) {
        throw new Error("403 Forbidden: You are not authorized to edit this student profile.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Update public.students.full_name
    const { error: studentUpdateError } = await supabaseAdmin
      .from("students")
      .update({ full_name: data.fullName })
      .eq("id", resolvedStudent.id);

    if (studentUpdateError) {
      console.error(`Failed to update student name for ${resolvedStudent.id}:`, studentUpdateError.message);
      throw new Error(`500 Internal Server Error: ${studentUpdateError.message}`);
    }

    // 2. Query latest student_profiles row for this student (order by submitted_at desc, created_at desc)
    const { data: profileRows } = await supabaseAdmin
      .from("student_profiles")
      .select("id")
      .or(`student_id.eq.${resolvedStudent.id},email.ilike.${resolvedStudent.email}`)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1);

    const latestProfileRow = profileRows && profileRows.length > 0 ? profileRows[0] : null;

    if (latestProfileRow) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from("student_profiles")
        .update({
          phone: data.phone,
          current_degree: data.currentDegree,
          branch: data.branch,
          graduation_year: data.graduationYear,
          cgpa: data.cgpa,
          preferred_country: data.preferredCountry,
          preferred_course: data.preferredCourse,
          preferred_intake: data.preferredIntake,
          english_test: data.englishTest,
          budget: data.budget,
          additional_info: data.additionalInfo,
        })
        .eq("id", latestProfileRow.id);

      if (profileUpdateError) {
        console.error(`Failed to update student profile ${latestProfileRow.id}:`, profileUpdateError.message);
        throw new Error(`500 Internal Server Error: ${profileUpdateError.message}`);
      }
    } else {
      const { error: profileInsertError } = await supabaseAdmin
        .from("student_profiles")
        .insert({
          student_id: resolvedStudent.id,
          email: resolvedStudent.email,
          phone: data.phone,
          current_degree: data.currentDegree,
          branch: data.branch,
          graduation_year: data.graduationYear,
          cgpa: data.cgpa,
          preferred_country: data.preferredCountry,
          preferred_course: data.preferredCourse,
          preferred_intake: data.preferredIntake,
          english_test: data.englishTest,
          budget: data.budget,
          additional_info: data.additionalInfo,
          submitted_at: new Date().toISOString(),
        });

      if (profileInsertError) {
        console.error(`Failed to insert student profile:`, profileInsertError.message);
        throw new Error(`500 Internal Server Error: ${profileInsertError.message}`);
      }
    }

    const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
    invalidatePortalCache();

    return {
      success: true,
      studentId: resolvedStudent.id,
      email: resolvedStudent.email,
      fullName: data.fullName,
    };
  });
