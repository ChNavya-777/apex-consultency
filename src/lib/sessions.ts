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
  /** Source "counsellor_name", displayed as Counsellor. */
  counsellorName: string;
  /** ISO-ish start/end timestamps from the source — never mutated. */
  startTime: string;
  endTime: string;
  meetingUrl?: string | null;
  status?: SessionStatus | undefined;
  /**
   * Preferred future match key for the student record. When the external source cannot supply
   * an ID, `studentEmail` is the temporary fallback (see `sessionBelongsToStudent`).
   */
  studentId?: string | null;

  /* --- Booking Sheet fields (optional: older readers don't set them) --- */
  /** Booking Sheet `counsellor_email` — the counsellor assignment key. */
  counsellorEmail?: string;
  /** IANA timezone from the booking (`timezone`), used for display. */
  timezone?: string | null;
  sessionName?: string;
  bookingEvent?: string;
  bookingStatus?: string;
  inviteeStatus?: string;
  eventUri?: string;
  cancelUrl?: string | null;
  rescheduleUrl?: string | null;
  /** Raw `questions_and_answers` cell, already parsed to pairs where possible. */
  questionsAndAnswers?: { question: string; answer: string }[];
  /** True when the source marks this booking as rescheduled (history, not active). */
  rescheduled?: boolean;
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

/* ------------------------------------------------------------------ */
/* Booking Sheet time handling                                        */
/* ------------------------------------------------------------------ */

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

/**
 * Length of a consultation slot, in minutes.
 *
 * The Calendly event type used for consultations ("Session meeting") is a 60-minute slot, and the
 * Booking Sheet does not carry a duration column. It is only used to derive the slot START from a
 * booking row that supplies the slot END (see `sessionSlot`); it never shifts a timestamp that the
 * source already reports as a start.
 */
export const SESSION_DURATION_MINUTES = 60;

/**
 * The scheduled slot for a booking.
 *
 * For bookings written by the Calendly webhook, `start_time` carries the moment the booking was
 * created and `end_time` carries the END of the meeting slot. When the two are more than 12h
 * apart the row is read that way: the later timestamp is the slot end, and the slot start is that
 * end minus the consultation duration — which is the time Calendly itself reports to the invitee
 * and the counsellor. Source values are never modified.
 */
export function sessionSlot(session: ConsultationSession): {
  start: Date | null;
  end: Date | null;
} {
  const start = parse(session.startTime);
  const end = parse(session.endTime);
  if (start && end && end.getTime() - start.getTime() > TWELVE_HOURS) {
    return {
      start: new Date(end.getTime() - SESSION_DURATION_MINUTES * 60 * 1000),
      end,
    };
  }
  if (start && end && end.getTime() < start.getTime()) return { start: end, end: start };
  return { start, end };
}


function zone(session: ConsultationSession): string | undefined {
  const tz = session.timezone?.trim();
  return tz ? tz : undefined;
}

function formatDateIn(date: Date, tz?: string): string {
  // en-GB renders September as "Sept"; the portal shows the 3-letter form ("17 Sep 2026").
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(tz ? { timeZone: tz } : {}),
  })
    .format(date)
    .replace("Sept", "Sep");
}


function formatTimeIn(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  }).format(date);
}

/** Readable date for a booking, in the booking's own timezone — e.g. "17 Sep 2026". */
export function sessionDateLabel(session: ConsultationSession): string {
  const { start } = sessionSlot(session);
  if (!start) return session.startTime || "—";
  return formatDateIn(start, zone(session));
}

/** Readable time for a booking — e.g. "12:00 PM" or "12:00 PM – 12:30 PM". */
export function sessionTimeLabel(session: ConsultationSession): string {
  const { start, end } = sessionSlot(session);
  if (!start) return session.startTime || "—";
  const tz = zone(session);
  const startLabel = formatTimeIn(start, tz);
  return end ? `${startLabel} – ${formatTimeIn(end, tz)}` : startLabel;
}

/** Slot end used for elapsed-time checks (falls back to the slot start). */
function slotEnd(session: ConsultationSession): Date | null {
  const { start, end } = sessionSlot(session);
  return end ?? start;
}

export function isSessionCancelled(session: ConsultationSession): boolean {
  return session.status === "cancelled";
}

/** Same calendar day as `reference`, evaluated in the booking's timezone. */
export function isSessionToday(session: ConsultationSession, reference = new Date()): boolean {
  const { start } = sessionSlot(session);
  if (!start) return false;
  const tz = zone(session);
  return formatDateIn(start, tz) === formatDateIn(reference, tz);
}

/** Active (not cancelled) and still in the future. */
export function isSessionUpcoming(session: ConsultationSession, reference = new Date()): boolean {
  if (isSessionCancelled(session) || session.rescheduled) return false;
  const end = slotEnd(session);
  return !!end && end.getTime() >= reference.getTime();
}

/** Actually occurred: not cancelled and its slot has passed. */
export function isSessionCompleted(session: ConsultationSession, reference = new Date()): boolean {
  if (isSessionCancelled(session) || session.rescheduled) return false;
  const end = slotEnd(session);
  return !!end && end.getTime() < reference.getTime();
}
