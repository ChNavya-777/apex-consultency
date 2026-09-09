import { createFileRoute } from "@tanstack/react-router";

/**
 * Booking Sheet → Supabase synchronisation endpoint (Phase 6C-2).
 *
 * The Calendly → Booking Sheet integration lives outside this application, so the app has no
 * Calendly payload of its own. This endpoint lets a scheduler (pg_cron / n8n / the existing
 * Calendly-side automation) trigger a sync pass after a booking is written to the sheet. It never
 * modifies the sheet and never creates students, counsellors or Auth users.
 *
 * Caller verification: a shared secret header. The route is public only in the routing sense.
 */
export const Route = createFileRoute("/api/public/booking-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["LOVABLE_CRON_SECRET"];
        if (!expected) {
          return Response.json({ success: false, message: "Sync is not configured." }, { status: 503 });
        }
        const provided =
          request.headers.get("x-apex-sync-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { syncBookingsToSupabase } = await import("@/lib/booking-sync.server");
        const report = await syncBookingsToSupabase();
        return Response.json({ success: report.ok, ...report }, { status: report.ok ? 200 : 502 });
      },
    },
  },
});
