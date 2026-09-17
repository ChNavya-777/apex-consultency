/**
 * SERVER-ONLY Calendly booking synchroniser (Phase 6C-2).
 *
 * The Booking Sheet is populated by the external Calendly → Sheet integration; the application
 * itself receives no Calendly webhook payload. This module therefore takes the Booking Sheet rows
 * that already exist (the only booking payload available to the app) and persists each booking
 * into Supabase, so a new booking ends up in BOTH places:
 *
 *   Calendly → Booking Sheet (unchanged, external) → Supabase `sessions` / `session_questions`
 *
 * Guarantees:
 *   - identity is the booking UID (last path segment of cancel_url, else event_uri) — the same
 *     strategy the historical migration used, so re-processing a booking never inserts a second row
 *   - a booking whose student or counsellor email does not already exist in Supabase is SKIPPED and
 *     reported; no student, counsellor or Auth user is ever created here
 *   - the actual 60-minute meeting slot is stored (Booking Sheet `end_time` is the slot end and
 *     `start_time` the booking creation instant), as UTC timestamptz, with no +05:30 shift
 *   - rows already stored with identical values are left completely untouched
 *   - writes run through the service-role client inside server handlers only; RLS is unchanged
 */

import { normalizeEmail } from "@/lib/counsellor-roster";
import { sessionSlot } from "@/lib/sessions";
import type { ConsultationSession } from "@/lib/sessions";
import { readSheetRows } from "@/lib/sheets.server";

const BOOKING_SHEET_ID =
  process.env["BOOKING_SHEET_ID"] ?? "1qAOhsbQSOAgS9a59ReIz3JGygbF4iyoF7pfSGoJXJgA";
const BOOKING_RANGE = "A1:P2000";

export type BookingSyncReport = {
  ok: boolean;
  scanned: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skippedUnmatchedStudent: string[];
  skippedUnmatchedCounsellor: string[];
  skippedUnusable: number;
  questionsWritten: number;
  error?: string;
};

type QA = { question: string; answer: string };

type Booking = {
  bookingUid: string;
  studentEmail: string;
  studentName: string;
  counsellorEmail: string;
  counsellorName: string;
  counsellorUserUri: string;
  sessionName: string;
  bookingEvent: string;
  bookingStatus: string;
  inviteeStatus: string;
  eventUri: string;
  cancelUrl: string;
  rescheduleUrl: string;
  timezone: string;
  /** Actual meeting slot, ISO UTC. */
  startIso: string | null;
  endIso: string | null;
  rescheduled: boolean;
  cancelled: boolean;
  questions: QA[];
};

function lastPathSegment(url: string): string {
  const parts = url.trim().replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] ?? "";
}

function parseQuestions(raw: string): QA[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const record = (item ?? {}) as Record<string, unknown>;
        return {
          question: String(record["question"] ?? "").trim(),
          answer: String(record["answer"] ?? "").trim(),
        };
      })
      .filter((qa) => qa.question || qa.answer);
  } catch {
    return [];
  }
}

function toBooking(row: Record<string, string>): Booking | null {
  const startTime = (row["start_time"] ?? "").trim();
  const endTime = (row["end_time"] ?? "").trim();
  const eventUri = (row["event_uri"] ?? "").trim();
  const cancelUrl = (row["cancel_url"] ?? "").trim();
  const studentEmail = normalizeEmail(row["student_email"]);
  const bookingUid = lastPathSegment(cancelUrl) || lastPathSegment(eventUri);

  // Without a stable booking identity or a slot end there is nothing safe to store.
  if (!bookingUid || !studentEmail || !endTime) return null;

  const bookingStatus = (row["booking_status"] ?? "").trim();
  const inviteeStatus = (row["invitee_status"] ?? "").trim();
  const bookingEvent = (row["booking_event"] ?? "").trim();
  const lower = `${bookingStatus} ${inviteeStatus} ${bookingEvent}`.toLowerCase();

  // Actual meeting slot from the shared booking-time logic (end_time − 60 min when the row
  // carries a booking-creation start_time). Timestamps stay UTC; nothing is shifted.
  const slot = sessionSlot({ startTime, endTime } as ConsultationSession);

  return {
    bookingUid,
    studentEmail,
    studentName: (row["student_name"] ?? "").trim(),
    counsellorEmail: normalizeEmail(row["counsellor_email"]),
    counsellorName: (row["counsellor_name"] ?? "").trim(),
    counsellorUserUri: (row["counsellor_user_uri"] ?? "").trim(),
    sessionName: (row["session_name"] ?? "").trim(),
    bookingEvent,
    bookingStatus,
    inviteeStatus,
    eventUri,
    cancelUrl,
    rescheduleUrl: (row["reschedule_url"] ?? "").trim(),
    timezone: (row["timezone"] ?? "").trim(),
    startIso: slot.start ? slot.start.toISOString() : null,
    endIso: slot.end ? slot.end.toISOString() : null,
    rescheduled: lower.includes("reschedul"),
    cancelled: lower.includes("cancel"),
    questions: parseQuestions(row["questions_and_answers"] ?? ""),
  };
}

const sameInstant = (a: string | null, b: string | null): boolean => {
  if (!a || !b) return a === b;
  const x = new Date(a).getTime();
  const y = new Date(b).getTime();
  return Number.isNaN(x) || Number.isNaN(y) ? a === b : x === y;
};

/** One sync pass: read the Booking Sheet, then insert/update one Supabase session per booking. */
export async function syncBookingsToSupabase(): Promise<BookingSyncReport> {
  const report: BookingSyncReport = {
    ok: false,
    scanned: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skippedUnmatchedStudent: [],
    skippedUnmatchedCounsellor: [],
    skippedUnusable: 0,
    questionsWritten: 0,
  };

  try {
    const rows = await readSheetRows(BOOKING_SHEET_ID, BOOKING_RANGE);
    report.scanned = rows.length;

    /* One logical record per booking UID: later events (cancel/reschedule) win. */
    const byUid = new Map<string, Booking>();
    for (const row of rows) {
      const booking = toBooking(row);
      if (!booking) {
        report.skippedUnusable += 1;
        continue;
      }
      byUid.set(booking.bookingUid, booking);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [studentsRes, counsellorsRes, sessionsRes] = await Promise.all([
      supabaseAdmin.from("students").select("id, email, full_name"),
      supabaseAdmin.from("counsellors").select("id, email, full_name"),
      supabaseAdmin.from("sessions").select("*"),
    ]);
    for (const res of [studentsRes, counsellorsRes, sessionsRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const studentByEmail = new Map(
      (studentsRes.data ?? []).map((s) => [normalizeEmail(s.email), s]),
    );
    const counsellorByEmail = new Map(
      (counsellorsRes.data ?? []).map((c) => [normalizeEmail(c.email), c]),
    );
    const existingByUid = new Map((sessionsRes.data ?? []).map((s) => [s.booking_uid, s]));

    for (const booking of byUid.values()) {
      const student = studentByEmail.get(booking.studentEmail);
      if (!student) {
        // Historical unmatched emails are known and intentionally not backfilled.
        report.skippedUnmatchedStudent.push(booking.studentEmail);
        continue;
      }
      const counsellor = booking.counsellorEmail
        ? counsellorByEmail.get(booking.counsellorEmail)
        : undefined;
      if (!counsellor) {
        // Never guess by name and never insert an unassigned/mis-assigned session.
        report.skippedUnmatchedCounsellor.push(booking.counsellorEmail || "(empty)");
        continue;
      }

      const values = {
        booking_uid: booking.bookingUid,
        student_id: student.id,
        student_email: booking.studentEmail,
        student_name: booking.studentName || student.full_name || null,
        counsellor_id: counsellor.id,
        counsellor_email: booking.counsellorEmail,
        counsellor_name: booking.counsellorName || counsellor.full_name || null,
        counsellor_user_uri: booking.counsellorUserUri || null,
        session_name: booking.sessionName || null,
        booking_event: booking.bookingEvent || null,
        booking_status: booking.bookingStatus || null,
        invitee_status: booking.inviteeStatus || null,
        event_uri: booking.eventUri || null,
        cancel_url: booking.cancelUrl || null,
        reschedule_url: booking.rescheduleUrl || null,
        timezone: booking.timezone || null,
        start_time: booking.startIso,
        end_time: booking.endIso,
        rescheduled: booking.rescheduled,
        status: booking.cancelled ? "cancelled" : null,
        counsellor_outcome: existing?.counsellor_outcome ?? null,
        counsellor_notes: existing?.counsellor_notes ?? null,
        outcome_updated_at: existing?.outcome_updated_at ?? null,
      };

      const existing = existingByUid.get(booking.bookingUid);
      let sessionId: string;

      if (!existing) {
        const inserted = await supabaseAdmin
          .from("sessions")
          .insert(values)
          .select("id")
          .single();
        if (inserted.error) throw new Error(inserted.error.message);
        sessionId = inserted.data.id;
        report.inserted += 1;
      } else {
        sessionId = existing.id;
        // Preserve the stored status classification of historical rows: only overwrite `status`
        // when this booking is (now) cancelled.
        const { status: statusValue, ...withoutStatus } = values;
        const patch = statusValue === null ? withoutStatus : values;

        const changed = Object.entries(patch).some(([key, value]) => {
          const current = (existing as Record<string, unknown>)[key] ?? null;
          if (key === "start_time" || key === "end_time") {
            return !sameInstant(current as string | null, value as string | null);
          }
          return (current ?? null) !== (value ?? null);
        });

        if (changed) {
          const updated = await supabaseAdmin.from("sessions").update(patch).eq("id", sessionId);
          if (updated.error) throw new Error(updated.error.message);
          report.updated += 1;
        } else {
          report.unchanged += 1;
        }
      }

      /* Questions: rewritten only when they actually differ, so reprocessing adds no duplicates. */
      if (booking.questions.length > 0) {
        const stored = await supabaseAdmin
          .from("session_questions")
          .select("id, question, answer, position")
          .eq("session_id", sessionId)
          .order("position");
        if (stored.error) throw new Error(stored.error.message);

        const current = (stored.data ?? []).map((q) => ({
          question: (q.question ?? "").trim(),
          answer: (q.answer ?? "").trim(),
        }));
        const wanted = booking.questions;
        const identical =
          current.length === wanted.length &&
          current.every(
            (q, i) => q.question === wanted[i]!.question && q.answer === wanted[i]!.answer,
          );

        if (!identical) {
          if (current.length > 0) {
            const cleared = await supabaseAdmin
              .from("session_questions")
              .delete()
              .eq("session_id", sessionId);
            if (cleared.error) throw new Error(cleared.error.message);
          }
          const insertedQs = await supabaseAdmin.from("session_questions").insert(
            wanted.map((qa, index) => ({
              session_id: sessionId,
              question: qa.question,
              answer: qa.answer,
              position: index,
            })),
          );
          if (insertedQs.error) throw new Error(insertedQs.error.message);
          report.questionsWritten += wanted.length;
        }
      }
    }

    report.ok = true;
    if (report.inserted > 0 || report.updated > 0 || report.questionsWritten > 0) {
      const { invalidatePortalCache } = await import("@/lib/portal-supabase.server");
      invalidatePortalCache();
    }

    if (report.skippedUnmatchedStudent.length > 0) {
      console.warn(
        `Booking sync: ${report.skippedUnmatchedStudent.length} booking(s) skipped — student not in Supabase: ${[
          ...new Set(report.skippedUnmatchedStudent),
        ].join(", ")}`,
      );
    }
    if (report.skippedUnmatchedCounsellor.length > 0) {
      console.warn(
        `Booking sync: ${report.skippedUnmatchedCounsellor.length} booking(s) skipped — counsellor email not in Supabase: ${[
          ...new Set(report.skippedUnmatchedCounsellor),
        ].join(", ")}`,
      );
    }
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Booking sync failed:", message);
    return { ...report, ok: false, error: message };
  }
}
