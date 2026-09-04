import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalCard, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import {
  SessionEmptyState,
  SessionFilters,
  SessionTable,
  emptySessionFilters,
  type SessionFilterState,
} from "@/components/sessions/SessionUI";
import { isSessionCompleted, isSessionToday, isSessionUpcoming } from "@/lib/sessions";
import { useAdminPortalData } from "@/lib/use-portal-data";
import { useCounsellors } from "@/lib/portal-auth";
import { cn } from "@/lib/utils";

const title = "Consultation Sessions — APEX Global Education Portal";
const description = "View and manage scheduled student consultations.";

export const Route = createFileRoute("/admin/sessions/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSessionsPage,
});

const tabs = ["All", "Upcoming", "Completed"] as const;

function AdminSessionsPage() {
  const session = useRequireRole("super_admin");
  const counsellors = useCounsellors();
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [filters, setFilters] = useState<SessionFilterState>(emptySessionFilters);

  const { data } = useAdminPortalData();

  const sessions = useMemo(() => {
    const all = data.sessions;
    return all.filter((s) => {
      if (tab === "Upcoming" && !isSessionUpcoming(s)) return false;
      if (tab === "Completed" && !isSessionCompleted(s)) return false;
      if (filters.status !== "all" && s.status !== filters.status) return false;
      if (filters.counsellor !== "all" && s.counsellorName !== filters.counsellor) return false;
      if (filters.date && !isSessionToday(s, new Date(filters.date))) return false;
      const q = filters.search.trim().toLowerCase();
      if (
        q &&
        ![s.studentName, s.studentEmail, s.bookingUid].some((v) => v.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [data.sessions, tab, filters]);

  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading
        title="Consultation Sessions"
        text="View and manage scheduled student consultations."
      />

      <PortalCard className="mb-5">
        <SessionFilters
          value={filters}
          onChange={setFilters}
          counsellors={counsellors.map((c) => c.name)}
        />
      </PortalCard>

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

      <SessionTable
        sessions={sessions}
        empty={<SessionEmptyState />}
        renderView={(s) => (
          <Link
            to="/admin/sessions/$id"
            params={{ id: s.bookingUid }}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            View
          </Link>
        )}
      />
    </PortalLayout>
  );
}
