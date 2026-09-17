import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { CounsellorOutcomeActions, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { SessionOutcomeModal } from "@/components/sessions/SessionOutcomeModal";
import {
  isSessionAwaitingOutcome,
  isSessionCancelled,
  isSessionCompleted,
  isSessionToday,
  isSessionUpcoming,
  type CounsellorOutcome,
  type ConsultationSession,
} from "@/lib/sessions";
import { useCounsellorPortalData } from "@/lib/use-portal-data";
import { cn } from "@/lib/utils";

const title = "My Sessions — APEX Global Education Portal";
const description = "View your assigned student consultations.";

export const Route = createFileRoute("/counsellor/sessions/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorSessionsPage,
});

const tabs = ["Today", "Upcoming", "Awaiting Outcome", "Completed"] as const;

function CounsellorSessionsPage() {
  const session = useRequireRole("counsellor");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Today");
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [targetOutcome, setTargetOutcome] = useState<CounsellorOutcome | null>(null);

  /** Filtered on the server by the signed-in counsellor's login email. */
  const { data, isLoading } = useCounsellorPortalData(session?.email);

  const sessions = useMemo(() => {
    return data.sessions.filter((s) => {
      if (tab === "Today") return isSessionToday(s) && !isSessionCancelled(s) && !s.rescheduled;
      if (tab === "Upcoming") return isSessionUpcoming(s);
      if (tab === "Awaiting Outcome") return isSessionAwaitingOutcome(s);
      return isSessionCompleted(s);
    });
  }, [data.sessions, tab]);

  if (!session) return null;

  const handleOpenOutcome = (s: ConsultationSession, outcome: CounsellorOutcome) => {
    setActiveSession(s);
    setTargetOutcome(outcome);
  };

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title="My Sessions" text="View your assigned student consultations." />

      <div
        role="tablist"
        aria-label="Session range"
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
              "min-w-[6.5rem] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
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
          title={isLoading ? "Loading your sessions…" : "No sessions scheduled"}
          text={`Consultations booked with you that fall under "${tab}" will appear here.`}
        />

      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.bookingUid}
              session={s}
              actions={
                <CounsellorOutcomeActions
                  session={s}
                  onOpenOutcome={handleOpenOutcome}
                  showViewStudent
                />
              }
            />
          ))}
        </div>
      )}

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

