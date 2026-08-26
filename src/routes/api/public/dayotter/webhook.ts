import { createFileRoute } from "@tanstack/react-router";

/**
 * Alias of /api/dayotter/webhook. The /api/public prefix bypasses the
 * published-site auth gate, so DayOtter can always reach the endpoint.
 * Security is enforced inside the handler via HMAC-SHA-256 signature
 * verification against the raw request body.
 */
export const Route = createFileRoute("/api/public/dayotter/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleDayotterWebhook } = await import("@/lib/dayotter.server");
        return handleDayotterWebhook(request);
      },
    },
  },
});
