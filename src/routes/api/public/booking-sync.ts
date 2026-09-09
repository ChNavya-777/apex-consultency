import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Booking Sheet → Supabase synchronisation endpoint (Phase 6C-2B).
 *
 * The Calendly → Booking Sheet integration lives outside this application, so the app has no
 * Calendly payload of its own. This endpoint is the authoritative, browser-independent way to
 * import new/changed bookings: an external scheduler (cron service, n8n schedule trigger) calls it
 * on a fixed interval. It never modifies the sheet and never creates students, counsellors or
 * Auth users, and it is safe to call repeatedly (identity is the booking UID).
 *
 * Caller verification: shared secret. Accepted forms:
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>   (preferred; supports secret rotation)
 *   x-apex-sync-secret: <LOVABLE_CRON_SECRET>     (legacy header)
 * GET and POST behave identically so schedulers restricted to GET can be used.
 */

async function runSync(request: Request): Promise<Response> {
  const expected = process.env["LOVABLE_CRON_SECRET"];
  if (!expected) {
    return Response.json({ success: false, message: "Sync is not configured." }, { status: 503 });
  }

  const legacy = request.headers.get("x-apex-sync-secret") ?? "";
  if (legacy !== expected) {
    const rejected = await authenticateCronRequest(request);
    if (rejected) return rejected;
  }

  const { syncBookingsToSupabase } = await import("@/lib/booking-sync.server");
  const report = await syncBookingsToSupabase();
  return Response.json({ success: report.ok, ...report }, { status: report.ok ? 200 : 502 });
}

export const Route = createFileRoute("/api/public/booking-sync")({
  server: {
    handlers: {
      GET: async ({ request }) => runSync(request),
      POST: async ({ request }) => runSync(request),
    },
  },
});
