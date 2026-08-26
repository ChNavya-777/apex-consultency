/**
 * DayOtter webhook helpers — SERVER ONLY.
 *
 * Never import this module from browser code: it reads the webhook signing
 * secret. The secret is only ever read inside handler bodies.
 */

export type DayotterEventType = "booking.created" | "booking.cancelled" | "booking.rescheduled";

export type StoredBookingEvent = {
  /** Event name as sent by DayOtter. */
  event: string;
  /** ISO timestamp of when APEX received the webhook. */
  receivedAt: string;
  /**
   * The COMPLETE verified payload, exactly as DayOtter sent it — no renaming,
   * no field guessing, no trimming. This is what we inspect after the first
   * real booking to design the session-details UI.
   */
  payload: unknown;
};

const MAX_EVENTS = 50;

/**
 * Best-effort in-process store. The server runs on stateless workers, so this
 * is intentionally a debugging/inspection buffer for the first real bookings
 * (paired with full console logging), not durable storage. Durable persistence
 * comes later, once the real payload shape is known.
 */
type Store = {
  recent: StoredBookingEvent[];
  byEmail: Map<string, StoredBookingEvent[]>;
};

const globalRef = globalThis as unknown as { __apexDayotterStore?: Store };

function getStore(): Store {
  if (!globalRef.__apexDayotterStore) {
    globalRef.__apexDayotterStore = { recent: [], byEmail: new Map() };
  }
  return globalRef.__apexDayotterStore;
}

/**
 * Collect every email-looking string found anywhere in the payload, so a
 * booking can be associated with the current student without assuming
 * DayOtter's field names.
 */
export function collectEmails(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    const match = value.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(match)) found.add(match);
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectEmails(item, found);
    return found;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) collectEmails(item, found);
  }
  return found;
}

export function recordBookingEvent(event: string, payload: unknown): StoredBookingEvent {
  const stored: StoredBookingEvent = {
    event,
    receivedAt: new Date().toISOString(),
    payload,
  };
  const store = getStore();
  store.recent.unshift(stored);
  if (store.recent.length > MAX_EVENTS) store.recent.length = MAX_EVENTS;

  for (const email of collectEmails(payload)) {
    const list = store.byEmail.get(email) ?? [];
    list.unshift(stored);
    if (list.length > MAX_EVENTS) list.length = MAX_EVENTS;
    store.byEmail.set(email, list);
  }
  return stored;
}

export function getRecentEvents(): StoredBookingEvent[] {
  return getStore().recent;
}

export function getEventsForEmail(email: string): StoredBookingEvent[] {
  return getStore().byEmail.get(email.trim().toLowerCase()) ?? [];
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Verify the `X-Dayotter-Signature` header as an HMAC-SHA-256 of the RAW
 * request body keyed with the webhook secret. Accepts the common encodings
 * (hex / base64, optionally prefixed with `sha256=`) so verification does not
 * depend on guessing one representation.
 */
export async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [toHex(digest), toBase64(digest)];

  const candidates = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .map((part) => (part.includes("=") ? part.slice(part.indexOf("=") + 1).trim() : part))
    .filter(Boolean);

  return candidates.some((candidate) =>
    expected.some(
      (exp) =>
        timingSafeEqual(candidate, exp) ||
        timingSafeEqual(candidate.toLowerCase(), exp.toLowerCase()),
    ),
  );
}

const HANDLED_EVENTS: DayotterEventType[] = [
  "booking.created",
  "booking.cancelled",
  "booking.rescheduled",
];

export function isHandledEvent(event: unknown): event is DayotterEventType {
  return typeof event === "string" && (HANDLED_EVENTS as string[]).includes(event);
}

/**
 * DayOtter may name the event key differently; read the common candidates
 * without renaming or reshaping the payload itself.
 */
export function extractEventName(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  for (const key of ["event", "type", "event_type", "eventType", "name"]) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

/**
 * Shared handler used by both the requested `/api/dayotter/webhook` path and
 * the `/api/public/...` alias (the public prefix keeps the endpoint reachable
 * on published sites regardless of site-level auth).
 */
export async function handleDayotterWebhook(request: Request): Promise<Response> {
  const secret = process.env["DAYOTTER_WEBHOOK_SECRET"];
  if (!secret) {
    console.error("DayOtter webhook rejected: DAYOTTER_WEBHOOK_SECRET is not configured");
    return Response.json({ success: false, message: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("x-dayotter-signature");
  if (!signature) {
    return Response.json({ success: false, message: "Missing signature." }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return Response.json({ success: false, message: "Empty body." }, { status: 400 });
  }

  const valid = await verifySignature(rawBody, signature, secret);
  if (!valid) {
    console.error("DayOtter webhook rejected: invalid signature");
    return Response.json({ success: false, message: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const event = extractEventName(payload);
  if (!isHandledEvent(event)) {
    // Verified but not one of the handled events — acknowledge without work.
    console.log("DayOtter webhook (unhandled event):", event, JSON.stringify(payload));
    return Response.json({ success: true, handled: false });
  }

  const stored = recordBookingEvent(event, payload);
  // Full verified payload preserved for inspection. The secret is never logged.
  console.log(`DayOtter webhook verified [${event}] FULL PAYLOAD:`, JSON.stringify(payload));

  return Response.json({ success: true, handled: true, event, receivedAt: stored.receivedAt });
}
