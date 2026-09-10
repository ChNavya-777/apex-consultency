/**
 * SERVER-ONLY Calendly webhook processor (Phase 6C-4).
 *
 * Real-time path:  Calendly → webhook → this module → Supabase `sessions` / `session_questions`.
 * The external Calendly → Booking Sheet integration is untouched and keeps running in parallel;
 * the periodic Booking-Sheet sync (`booking-sync.server.ts`) stays as-is and remains compatible,
 * because both paths use the SAME booking identity (the invitee UUID that is the last path
 * segment of `cancel_url`) and the same student/counsellor matching rules.
 *
 * Guarantees:
 *   - HMAC-SHA256 signature verification (`Calendly-Webhook-Signature: t=…,v1=…`) with a
 *     replay tolerance window; invalid or stale requests are rejected before any DB work
 *   - identity = booking UID → repeated deliveries update, never duplicate
 *   - student/counsellor are matched by normalized email ONLY; unmatched bookings are skipped
 *     (never creates a student, counsellor, password or Auth user)
 *   - timestamps stored exactly as Calendly reports them (timezone-aware → timestamptz)
 *   - reschedule: old invitee arrives as `invitee.canceled` (marked cancelled/rescheduled),
 *     new invitee arrives as `invitee.created` (its own active session)
 *   - Q&A rewritten only when it differs, so retries add no duplicate question rows
 */

import { normalizeEmail } from "@/lib/counsellor-roster";

/** Replay window for the signature timestamp. */
const SIGNATURE_TOLERANCE_SECONDS = 180;

export type WebhookOutcome =
  | { kind: "inserted" | "updated" | "unchanged"; bookingUid: string; questionsWritten: number }
  | { kind: "skipped"; bookingUid: string; reason: string }
  | { kind: "ignored"; reason: string };

type QA = { question: string; answer: string };

/* ------------------------------------------------------------------ */
/* Signature verification                                             */
/* ------------------------------------------------------------------ */

export type SignatureResult = { ok: true } | { ok: false; reason: string };

export async function verifyCalendlySignature(
  header: string | null,
  rawBody: string,
  signingKey: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<SignatureResult> {
  if (!header) return { ok: false, reason: "missing signature header" };

  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return { ok: false, reason: "malformed signature header" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "invalid signature timestamp" };
  if (Math.abs(nowSeconds - ts) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "stale signature timestamp" };
  }

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  const provided = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Payload normalisation                                              */
/* ------------------------------------------------------------------ */

function lastPathSegment(url: string): string {
  const parts = url.trim().replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] ?? "";
}

type Booking = {
  bookingUid: string;
  studentEmail: string;
  studentName: string;
  counsellorEmail: string;
  counsellorName: string;
  counsellorUserUri: string;
  sessionName: string;
  eventUri: string;
  cancelUrl: string;
  rescheduleUrl: string;
  timezone: string;
  startIso: string | null;
  endIso: string | null;
  inviteeStatus: string;
  cancelled: boolean;
  rescheduled: boolean;
  questions: QA[];
  calendlyEventTypeUri: string;
  calendlyLocation: string;
  calendlyInviteeUri: string;
};

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function formatCalendlyLocation(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const loc = value as Record<string, unknown>;
    if (typeof loc["join_url"] === "string" && loc["join_url"]) return loc["join_url"].trim();
    if (typeof loc["location"] === "string" && loc["location"]) return loc["location"].trim();
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

export function toBookingFromWebhook(event: string, payload: unknown): Booking | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  const cancelUrl = str(p["cancel_url"]);
  const inviteeUri = str(p["uri"]);
  const bookingUid = lastPathSegment(cancelUrl) || lastPathSegment(inviteeUri);
  const studentEmail = normalizeEmail(str(p["email"]));
  if (!bookingUid || !studentEmail) return null;

  const scheduled = (p["scheduled_event"] ?? {}) as Record<string, unknown>;
  const memberships = Array.isArray(scheduled["event_memberships"])
    ? (scheduled["event_memberships"] as Record<string, unknown>[])
    : [];
  const host = memberships[0] ?? {};

  const qaRaw = Array.isArray(p["questions_and_answers"])
    ? (p["questions_and_answers"] as Record<string, unknown>[])
    : [];
  const questions = qaRaw
    .map((item) => ({ question: str(item["question"]), answer: str(item["answer"]) }))
    .filter((qa) => qa.question || qa.answer);

  const cancelled = event === "invitee.canceled" || str(p["status"]).toLowerCase() === "canceled";
  // Calendly marks the OLD invitee of a reschedule with `rescheduled: true`.
  const rescheduled = p["rescheduled"] === true;

  const eventTypeUri = str(scheduled["event_type"]);
  const calendlyLocation = formatCalendlyLocation(scheduled["location"]);

  return {
    bookingUid,
    studentEmail,
    studentName: str(p["name"]),
    counsellorEmail: normalizeEmail(str(host["user_email"])),
    counsellorName: str(host["user_name"]),
    counsellorUserUri: str(host["user"]),
    sessionName: str(scheduled["name"]),
    eventUri: str(scheduled["uri"]),
    cancelUrl,
    rescheduleUrl: str(p["reschedule_url"]),
    timezone: str(p["timezone"]),
    startIso: str(scheduled["start_time"]) || null,
    endIso: str(scheduled["end_time"]) || null,
    inviteeStatus: str(p["status"]),
    cancelled,
    rescheduled,
    questions,
    calendlyEventTypeUri: eventTypeUri,
    calendlyLocation,
    calendlyInviteeUri: inviteeUri,
  };
}

/* ------------------------------------------------------------------ */
/* Calendly API enrichment (server-only, Personal Access Token)        */
/* ------------------------------------------------------------------ */

const CALENDLY_API = "https://api.calendly.com";

async function calendlyGet(url: string, token: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      // Never log the token; only status + resource path.
      console.warn(`Calendly API ${new URL(url).pathname} responded ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { resource?: unknown };
    return (body?.resource ?? null) as Record<string, unknown> | null;
  } catch (error) {
    console.warn(
      `Calendly API request failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return null;
  }
}

/**
 * Fills any detail the webhook payload omits by reading the authoritative invitee +
 * scheduled-event resources from the Calendly API. Purely additive: webhook values win,
 * the API only supplies what is missing, so behaviour is unchanged when the token is absent.
 */
export async function enrichCalendlyPayload(payload: unknown): Promise<unknown> {
  const token = process.env["CALENDLY_PERSONAL_ACCESS_TOKEN"];
  const p = (payload ?? {}) as Record<string, unknown>;
  const inviteeUri = str(p["uri"]);
  if (!token || !inviteeUri.startsWith(`${CALENDLY_API}/`)) return payload;

  const invitee = await calendlyGet(inviteeUri, token);
  if (!invitee) return payload;

  const merged: Record<string, unknown> = { ...invitee, ...p };

  const webhookScheduled = (p["scheduled_event"] ?? {}) as Record<string, unknown>;
  const eventUri = str(invitee["event"]) || str(webhookScheduled["uri"]);
  let scheduled: Record<string, unknown> | null = null;
  if (eventUri.startsWith(`${CALENDLY_API}/`)) {
    scheduled = await calendlyGet(eventUri, token);
  }
  if (scheduled) {
    merged["scheduled_event"] = { ...scheduled, ...webhookScheduled };
  }

  return merged;
}

/* ------------------------------------------------------------------ */
/* Supabase write                                                     */
/* ------------------------------------------------------------------ */

export async function processCalendlyWebhook(
  event: string,
  rawPayload: unknown,
): Promise<WebhookOutcome> {
  if (event !== "invitee.created" && event !== "invitee.canceled") {
    return { kind: "ignored", reason: `unsupported event: ${event}` };
  }

  const payload = await enrichCalendlyPayload(rawPayload);
  const booking = toBookingFromWebhook(event, payload);
  if (!booking) return { kind: "ignored", reason: "payload lacks booking identity or email" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [studentRes, counsellorRes, existingRes] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, email, full_name")
      .ilike("email", booking.studentEmail)
      .limit(1),
    booking.counsellorEmail
      ? supabaseAdmin
          .from("counsellors")
          .select("id, email, full_name")
          .ilike("email", booking.counsellorEmail)
          .limit(1)
      : Promise.resolve({ data: [], error: null } as const),
    supabaseAdmin.from("sessions").select("*").eq("booking_uid", booking.bookingUid).limit(1),
  ]);
  for (const res of [studentRes, counsellorRes, existingRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const existing = (existingRes.data ?? [])[0];
  const student = (studentRes.data ?? [])[0];
  const counsellor = (counsellorRes.data ?? [])[0];

  // Never create students/counsellors here. A cancellation for a booking we already store is
  // still applied, because the record's ids are already resolved.
  if (!existing && !student) {
    return { kind: "skipped", bookingUid: booking.bookingUid, reason: "student not in Supabase" };
  }
  if (!existing && !counsellor) {
    return {
      kind: "skipped",
      bookingUid: booking.bookingUid,
      reason: "counsellor email not in Supabase",
    };
  }

  const values = {
    booking_uid: booking.bookingUid,
    student_id: student?.id ?? existing?.student_id ?? null,
    student_email: booking.studentEmail,
    student_name: booking.studentName || student?.full_name || existing?.student_name || null,
    counsellor_id: counsellor?.id ?? existing?.counsellor_id ?? null,
    counsellor_email: booking.counsellorEmail || existing?.counsellor_email || null,
    counsellor_name:
      booking.counsellorName || counsellor?.full_name || existing?.counsellor_name || null,
    counsellor_user_uri: booking.counsellorUserUri || existing?.counsellor_user_uri || null,
    session_name: booking.sessionName || existing?.session_name || null,
    booking_event: event,
    booking_status: booking.cancelled ? "canceled" : "active",
    invitee_status: booking.inviteeStatus || (booking.cancelled ? "canceled" : "active"),
    event_uri: booking.eventUri || existing?.event_uri || null,
    cancel_url: booking.cancelUrl || existing?.cancel_url || null,
    reschedule_url: booking.rescheduleUrl || existing?.reschedule_url || null,
    timezone: booking.timezone || existing?.timezone || null,
    start_time: booking.startIso ?? existing?.start_time ?? null,
    end_time: booking.endIso ?? existing?.end_time ?? null,
    rescheduled: booking.rescheduled || existing?.rescheduled === true,
    status: booking.cancelled ? "cancelled" : (existing?.status ?? null),
  };

  let sessionId: string;
  let kind: "inserted" | "updated" | "unchanged";

  if (!existing) {
    const inserted = await supabaseAdmin.from("sessions").insert(values).select("id").single();
    if (inserted.error) throw new Error(inserted.error.message);
    sessionId = inserted.data.id;
    kind = "inserted";
  } else {
    sessionId = existing.id;
    const changed = Object.entries(values).some(([key, value]) => {
      const current = (existing as Record<string, unknown>)[key] ?? null;
      if (key === "start_time" || key === "end_time") {
        const a = current as string | null;
        const b = value as string | null;
        if (!a || !b) return (a ?? null) !== (b ?? null);
        return new Date(a).getTime() !== new Date(b).getTime();
      }
      return (current ?? null) !== (value ?? null);
    });
    if (changed) {
      const updated = await supabaseAdmin.from("sessions").update(values).eq("id", sessionId);
      if (updated.error) throw new Error(updated.error.message);
      kind = "updated";
    } else {
      kind = "unchanged";
    }
  }

  /* Questions: rewrite only when they actually differ → retries never duplicate rows. */
  let questionsWritten = 0;
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
      current.every((q, i) => q.question === wanted[i]!.question && q.answer === wanted[i]!.answer);

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
      questionsWritten = wanted.length;
    }
  }

  return { kind, bookingUid: booking.bookingUid, questionsWritten };
}
