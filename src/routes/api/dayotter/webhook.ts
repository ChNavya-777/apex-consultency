import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dayotter/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleDayotterWebhook } = await import("@/lib/dayotter.server");
        return handleDayotterWebhook(request);
      },
    },
  },
});
