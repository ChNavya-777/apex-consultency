import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { MeetingButton, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { isSessionToday, isSessionUpcoming } from "@/lib/sessions";
import type { ConsultationSession } from "@/lib/sessions";
import { useCounsellorPortalData } from "@/lib/use-portal-data";
import { StudentTable } from "@/components/portal/StudentTable";

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
  /** Scoped on the server to this counsellor's login email only. */
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  if (!session) return null;

  const firstName = session.name.split(" ")[0] ?? session.name;

  const mine = data.sessions;
  const today = mine.filter((s) => isSessionToday(s) && isSessionUpcoming(s));
  const upcoming = mine.filter((s) => isSessionUpcoming(s));

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
            title={isLoading ? "Loading your sessions…" : "No sessions scheduled today."}
            text="Sessions booked with you for today will appear here."
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
            title={isLoading ? "Loading your sessions…" : "No upcoming consultations."}
            text="Consultations booked with you will appear here."
          />
        ) : (
          <SessionList sessions={upcoming} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">My Students</h2>
        {data.students.length === 0 ? (
          <EmptyState
            title={isLoading ? "Loading your students…" : "No students assigned yet."}
            text="Students linked to your consultation sessions will appear here."
          />
        ) : (
          <StudentTable students={data.students} note={data.studentSourceError} />
        )}
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
