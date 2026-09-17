import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { StudentHeading, StudentLayout, useRequireStudent } from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { MeetingButton, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { isSessionUpcoming } from "@/lib/sessions";
import { useStudentPortalData } from "@/lib/use-portal-data";
import { cn } from "@/lib/utils";

const title = "My Sessions — APEX Student Portal";
const description = "Your upcoming and completed APEX consultation sessions.";

export const Route = createFileRoute("/student/sessions/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentSessionsPage,
});

const tabs = ["Upcoming", "Completed"] as const;

function StudentSessionsPage() {
  const session = useRequireStudent();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");

  /** Filtered on the server by the signed-in student's normalised email. */
  const { data, isLoading } = useStudentPortalData(session?.email);

  /**
   * Upcoming = active booking whose real meeting slot has not ended (shared slot logic).
   * Everything else — past, cancelled, rescheduled — belongs to the Completed/past list.
   */
  const sessions = useMemo(
    () =>
      data.sessions.filter((s) =>
        tab === "Upcoming" ? isSessionUpcoming(s) : !isSessionUpcoming(s),
      ),
    [data.sessions, tab],
  );

  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Sessions" text="Your consultations with your APEX counsellor." />

      <div
        role="tablist"
        aria-label="Session status"
        className="mb-5 inline-flex rounded-xl bg-card p-1 shadow-soft"
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "min-w-[7rem] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-brand-blue/10 text-brand-blue"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <SessionEmptyState
          title={
            isLoading
              ? "Loading your consultations…"
              : tab === "Upcoming"
                ? "No upcoming consultations"
                : "No completed consultations"
          }
          text={
            tab === "Upcoming" && !isLoading
              ? "Ready to speak with our counselling team?"
              : "Your scheduled consultations will appear here once your booking is confirmed."
          }
          action={
            tab === "Upcoming" && !isLoading ? (
              <Link
                to="/consultation"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-blue/90"
              >
                <CalendarPlus className="h-4 w-4" /> Book a Consultation
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.bookingUid}
              session={s}
              showCounsellor
              actions={
                <>
                  <Link
                    to="/student/sessions/$id"
                    params={{ id: s.bookingUid }}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    View details
                  </Link>
                  <MeetingButton url={s.meetingUrl} size="sm" />
                </>
              }
            />
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
