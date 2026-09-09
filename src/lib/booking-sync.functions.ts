/**
 * Booking → Supabase synchronisation entry point (Phase 6C-2).
 *
 * Public by design: it carries no caller data and returns only counts. All Supabase work happens
 * inside the server-only module, through the service-role client, with RLS untouched.
 */

import { createServerFn } from "@tanstack/react-start";

export const syncCalendlyBookings = createServerFn({ method: "POST" }).handler(async () => {
  const { syncBookingsToSupabase } = await import("@/lib/booking-sync.server");
  const report = await syncBookingsToSupabase();
  return {
    ok: report.ok,
    inserted: report.inserted,
    updated: report.updated,
    unchanged: report.unchanged,
    skipped: report.skippedUnmatchedStudent.length + report.skippedUnmatchedCounsellor.length,
  };
});
