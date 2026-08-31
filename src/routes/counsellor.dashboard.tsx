import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { MeetingButton, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { getCounsellorSessions, isSameDay } from "@/lib/sessions";
import type { ConsultationSession } from "@/lib/sessions";

const title = "Counsellor Dashboard — APEX Global Education Portal";
const description = "Your APEX Global Education consultation workspace.";

export const Route = createFileRoute("/counsellor/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorDashboardPage,
});

function CounsellorDashboardPage() {
  const session = useRequireRole("counsellor");
  if (!session) return null;

  const firstName = session.name.split(" ")[0] ?? session.name;

  /** Scoped to this counsellor only. Empty until the booking source is connected. */
  const mine = getCounsellorSessions(session.name);
  const today = mine.filter((s) => isSameDay(s.startTime));
  const upcoming = mine.filter((s) => s.status === "upcoming" || s.status === "in_progress");

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading
        title={`Welcome, ${firstName} 👋`}
        text="Your consultation workspace"
        action={
          <Link
            to="/counsellor/sessions"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            View All Sessions
          </Link>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Today&apos;s Sessions
        </h2>
        {today.length === 0 ? (
          <SessionEmptyState
            title="No sessions scheduled today."
            text="Your assigned consultations will appear here once the booking system is connected."
          />
        ) : (
          <SessionList sessions={today} />
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Upcoming Sessions
        </h2>
        {upcoming.length === 0 ? (
          <SessionEmptyState
            title="No upcoming consultations."
            text="Consultations assigned to you will appear here once the booking system is connected."
          />
        ) : (
          <SessionList sessions={upcoming} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">My Students</h2>
        <EmptyState
          title="No students assigned yet."
          text="Students linked to your consultation sessions will appear here."
        />
      </section>
    </PortalLayout>
  );
}

function SessionList({ sessions }: { sessions: ConsultationSession[] }) {
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionCard
          key={s.bookingUid}
          session={s}
          actions={
            <>
              <Link
                to="/counsellor/sessions/$id"
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
  );
}
