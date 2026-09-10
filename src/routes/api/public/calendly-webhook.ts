import { createFileRoute } from "@tanstack/react-router";

/**
 * Calendly webhook receiver (Phase 6C-4).
 *
 * External callers only, so it lives under /api/public/* and authenticates itself with Calendly's
 * HMAC signature. Nothing here touches the Calendly → Booking Sheet integration or the periodic
 * Booking-Sheet sync; both keep running independently.
 *
 * Responses:
 *   200 — event processed (inserted/updated/unchanged/skipped/ignored)
 *   400 — malformed body
 *   401 — missing/invalid/stale signature
 *   503 — signing secret not configured
 *   500 — database failure (Calendly retries)
 */

const SIGNING_KEY_ENV = "CALENDLY_WEBHOOK_SIGNING_KEY";

export const Route = createFileRoute("/api/public/calendly-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signingKey = process.env[SIGNING_KEY_ENV];
        if (!signingKey) {
          console.error("Calendly webhook: signing secret is not configured.");
          return Response.json({ success: false, message: "Not configured." }, { status: 503 });
        }

        const rawBody = await request.text();

        const { verifyCalendlySignature, processCalendlyWebhook } = await import(
          "@/lib/calendly-webhook.server"
        );

        const signature = await verifyCalendlySignature(
          request.headers.get("calendly-webhook-signature"),
          rawBody,
          signingKey,
        );
        if (!signature.ok) {
          console.warn(`Calendly webhook rejected: ${signature.reason}`);
          return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        let event = "";
        let payload: unknown;
        try {
          const parsed = JSON.parse(rawBody) as { event?: unknown; payload?: unknown };
          event = typeof parsed.event === "string" ? parsed.event : "";
          payload = parsed.payload;
          if (!event || typeof payload !== "object" || payload === null) {
            throw new Error("missing event or payload");
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : "invalid JSON";
          console.warn(`Calendly webhook malformed payload: ${reason}`);
          return Response.json({ success: false, message: "Bad request." }, { status: 400 });
        }

        try {
          const outcome = await processCalendlyWebhook(event, payload);
          console.info(
            `Calendly webhook ${event}: ${outcome.kind}` +
              ("bookingUid" in outcome ? ` booking=${outcome.bookingUid}` : "") +
              ("reason" in outcome ? ` reason=${outcome.reason}` : ""),
          );
          return Response.json({ success: true, event, ...outcome }, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Calendly webhook ${event} failed: ${message}`);
          // 5xx so Calendly retries; never report success on a failed write.
          return Response.json({ success: false, message: "Processing failed." }, { status: 500 });
        }
      },
    },
  },
});
