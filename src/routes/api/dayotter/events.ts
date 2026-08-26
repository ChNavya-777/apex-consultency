import { createFileRoute } from "@tanstack/react-router";

/**
 * Debug inspection of captured DayOtter webhooks (complete verified payloads).
 * Protected by the same server-side webhook secret — pass it as
 * `x-dayotter-debug-key`. The secret itself is never returned or logged.
 */
export const Route = createFileRoute("/api/dayotter/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["DAYOTTER_WEBHOOK_SECRET"];
        if (!secret) {
          return Response.json(
            { success: false, message: "Webhook not configured." },
            { status: 503 },
          );
        }
        if (request.headers.get("x-dayotter-debug-key") !== secret) {
          return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const { getRecentEvents } = await import("@/lib/dayotter.server");
        return Response.json({ success: true, events: getRecentEvents() });
      },
    },
  },
});
