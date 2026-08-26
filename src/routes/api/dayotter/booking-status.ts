import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email() });

/**
 * Per-student booking status. Scoped to the email the student submitted on the
 * consultation form — there is no global booking status. A booking is only
 * reported as confirmed when a signature-verified `booking.created` webhook was
 * received AND its payload contains that student's email.
 */
export const Route = createFileRoute("/api/dayotter/booking-status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ success: false, message: "Invalid email." }, { status: 400 });
        }

        const { getEventsForEmail } = await import("@/lib/dayotter.server");
        const events = await getEventsForEmail(parsed.data.email);
        const created = events.find((e) => e.event === "booking.created");
        const cancelled = events.find((e) => e.event === "booking.cancelled");
        const rescheduled = events.find((e) => e.event === "booking.rescheduled");

        const latest = rescheduled ?? created;

        return Response.json({
          success: true,
          status: cancelled ? "cancelled" : created ? "confirmed" : "none",
          // The complete verified DayOtter payload, unmodified, so the session
          // details UI can be built from the real field names.
          booking: latest ?? null,
        });
      },
    },
  },
});
