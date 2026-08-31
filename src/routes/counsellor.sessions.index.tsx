import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { SessionCard, SessionEmptyState, MeetingButton } from "@/components/sessions/SessionUI";
import { getCounsellorSessions, isSameDay } from "@/lib/sessions";
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

const tabs = ["Today", "Upcoming", "Completed"] as const;

function CounsellorSessionsPage() {
  const session = useRequireRole("counsellor");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Today");

  /** Scoped to the signed-in counsellor only — never another counsellor's sessions. */
  const sessions = useMemo(() => {
    const mine = session ? getCounsellorSessions(session.name) : [];
    return mine.filter((s) => {
      if (tab === "Today") return isSameDay(s.startTime);
      if (tab === "Upcoming") return s.status === "upcoming" || s.status === "in_progress";
      return s.status === "completed";
    });
  }, [session, tab]);

  if (!session) return null;

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
          title="No sessions scheduled"
          text="Your assigned consultations will appear here once the booking system is connected."
        />
      ) : (
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
                  <Link
                    to="/counsellor/students"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                  >
                    View Student
                  </Link>
                  <MeetingButton url={s.meetingUrl} size="sm" />
                </>
              }
            />
          ))}
        </div>
      )}
    </PortalLayout>
  );
}
