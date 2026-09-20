import { createFileRoute } from "@tanstack/react-router";

/**
 * Automated Reminders Cron Receiver (Phase 6).
 *
 * Triggered daily by Vercel Cron at 03:30 UTC (09:00 AM IST).
 * Protected by Authorization: Bearer <CRON_SECRET>.
 */

export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cronSecret = process.env["CRON_SECRET"];
        const authHeader = request.headers.get("authorization");

        if (cronSecret) {
          if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return Response.json({ success: false, message: "Unauthorized cron execution." }, { status: 401 });
          }
        }

        try {
          const { processTaskReminders, processApplicationReminders } = await import("@/lib/reminders.server");
          const [taskResult, appResult] = await Promise.all([
            processTaskReminders(),
            processApplicationReminders(),
          ]);

          return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            tasksProcessed: taskResult.processed,
            taskNotificationsSent: taskResult.notificationsSent,
            appsProcessed: appResult.processed,
            appNotificationsSent: appResult.notificationsSent,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[CRON_REMINDERS_ROUTE_ERROR]", message);
          return Response.json({ success: false, message: "Reminder execution failed." }, { status: 500 });
        }
      },
    },
  },
});
