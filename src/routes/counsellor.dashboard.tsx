import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { CounsellorOutcomeActions, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { SessionOutcomeModal } from "@/components/sessions/SessionOutcomeModal";
import {
  isSessionAwaitingOutcome,
  isSessionCancelled,
  isSessionToday,
  isSessionUpcoming,
  type CounsellorOutcome,
  type ConsultationSession,
} from "@/lib/sessions";
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
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [targetOutcome, setTargetOutcome] = useState<CounsellorOutcome | null>(null);

  /** Scoped on the server to this counsellor's login email only. */
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  if (!session) return null;

  const firstName = session.name.split(" ")[0] ?? session.name;

  const mine = data.sessions;
  const awaitingOutcome = mine.filter((s) => isSessionAwaitingOutcome(s));
  const today = mine.filter((s) => isSessionToday(s) && !isSessionCancelled(s) && !s.rescheduled);
  const upcoming = mine.filter((s) => isSessionUpcoming(s));

  const handleOpenOutcome = (s: ConsultationSession, outcome: CounsellorOutcome) => {
    setActiveSession(s);
    setTargetOutcome(outcome);
  };

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

      {awaitingOutcome.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-amber-900 dark:text-amber-300">
              Awaiting Outcome ({awaitingOutcome.length})
            </h2>
            <span className="text-xs text-amber-800 dark:text-amber-400">
              Please record outcomes for completed consultations.
            </span>
          </div>
          <SessionList sessions={awaitingOutcome} onOpenOutcome={handleOpenOutcome} />
        </section>
      )}

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
          <SessionList sessions={today} onOpenOutcome={handleOpenOutcome} />
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
          <SessionList sessions={upcoming} onOpenOutcome={handleOpenOutcome} />
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

      {activeSession && targetOutcome && (
        <SessionOutcomeModal
          session={activeSession}
          targetOutcome={targetOutcome}
          isOpen={!!activeSession && !!targetOutcome}
          onClose={() => {
            setActiveSession(null);
            setTargetOutcome(null);
          }}
        />
      )}
    </PortalLayout>
  );
}

function SessionList({
  sessions,
  onOpenOutcome,
}: {
  sessions: ConsultationSession[];
  onOpenOutcome: (session: ConsultationSession, outcome: CounsellorOutcome) => void;
}) {
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionCard
          key={s.bookingUid}
          session={s}
          actions={
            <CounsellorOutcomeActions
              session={s}
              onOpenOutcome={onOpenOutcome}
            />
          }
        />
      ))}
    </div>
  );
}
