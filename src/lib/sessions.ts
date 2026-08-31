/**
 * CONSULTATION SESSION DOMAIN — presentation-independent.
 *
 * The future source of truth (booking sheet fed by the booking system) contains exactly:
 *   Booking UID | Student Name | Student Email | Mentor Name | Start Time | End Time | Meeting URL
 *
 * "Mentor Name" is an external source-field name only. Inside APEX it is always surfaced to
 * users as "Counsellor" (see `counsellorName` below).
 *
 * NO session records exist in this phase — every reader intentionally returns an empty list so
 * the UI renders honest empty states until the real source is connected.
 */

export type SessionStatus = "upcoming" | "in_progress" | "completed" | "cancelled" | "no_show";

export const sessionStatusLabels: Record<SessionStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export type ConsultationSession = {
  /** Booking UID from the external source; also the route param. */
  bookingUid: string;
  studentName: string;
  studentEmail: string;
  /** Source "Mentor Name", displayed as Counsellor. */
  counsellorName: string;
  /** ISO-ish start/end timestamps from the source. */
  startTime: string;
  endTime: string;
  meetingUrl?: string | null;
  status?: SessionStatus;
  /**
   * Preferred future match key for the student record. When the external source cannot supply
   * an ID, `studentEmail` is the temporary fallback (see `sessionBelongsToStudent`).
   */
  studentId?: string | null;
};

/* ------------------------------------------------------------------ */
/* Readers (empty until the booking source is connected)              */
/* ------------------------------------------------------------------ */

/** All sessions — Super Admin scope. */
export function getAllSessions(): ConsultationSession[] {
  return [];
}

/** Sessions assigned to one counsellor. A counsellor never receives another's sessions. */
export function getCounsellorSessions(_counsellorName: string): ConsultationSession[] {
  return [];
}

/** Sessions belonging to one student. A student never receives another student's sessions. */
export function getStudentSessions(_studentEmail: string): ConsultationSession[] {
  return [];
}

export function findSession(
  sessions: ConsultationSession[],
  bookingUid: string,
): ConsultationSession | null {
  return sessions.find((s) => s.bookingUid === bookingUid) ?? null;
}

/** Future matching: student ID first, email as a temporary fallback. */
export function sessionBelongsToStudent(
  session: ConsultationSession,
  student: { id?: string | null; email: string },
): boolean {
  if (student.id && session.studentId) return student.id === session.studentId;
  return session.studentEmail.trim().toLowerCase() === student.email.trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function parse(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "12 Mar 2026" — falls back to the raw value when it isn't parseable. */
export function formatSessionDate(value: string): string {
  const d = parse(value);
  if (!d) return value;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/** e.g. "09:00 AM" */
export function formatSessionTime(value: string): string {
  const d = parse(value);
  if (!d) return value;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
}

/** e.g. "09:00 AM – 09:30 AM" */
export function formatTimeRange(start: string, end: string): string {
  return `${formatSessionTime(start)} – ${formatSessionTime(end)}`;
}

/** Only http(s) links are treated as joinable meetings. */
export function isValidMeetingUrl(url?: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSameDay(value: string, reference = new Date()): boolean {
  const d = parse(value);
  if (!d) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}
