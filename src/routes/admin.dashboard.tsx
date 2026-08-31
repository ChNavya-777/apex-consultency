import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import { MeetingButton, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { getAllSessions, isSameDay } from "@/lib/sessions";


const title = "Super Admin Dashboard — APEX Global Education Portal";
const description = "Manage APEX Global Education operations from one place.";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPage,
});

const liveCards = [
  { label: "Students", text: "View student enquiries", to: "/admin/students" as const },
  { label: "Sessions", text: "View consultation sessions", to: "/admin/sessions" as const },
  { label: "Counsellors", text: "Manage counsellor accounts", to: "/admin/counsellors" as const },
];

const soonCards = [
  { label: "Applications" },
  { label: "Documents" },
  { label: "Reports" },
];

function AdminDashboardPage() {
  const session = useRequireRole("super_admin");
  if (!session) return null;

  /** Empty until the booking source is connected — no counts or records are invented. */
  const todaySessions = getAllSessions().filter((s) => isSameDay(s.startTime));

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading
        title="Welcome, Admin"
        text="Manage your APEX Global Education operations from one place."
      />

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Today&apos;s Sessions
          </h2>
          <Link
            to="/admin/sessions"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            View All Sessions
          </Link>
        </div>

        {todaySessions.length === 0 ? (
          <SessionEmptyState
            title="No sessions scheduled for today."
            text="Scheduled consultations will appear here once your booking system is connected."
          />
        ) : (
          <div className="space-y-3">
            {todaySessions.map((s) => (
              <SessionCard
                key={s.bookingUid}
                session={s}
                showCounsellor
                actions={
                  <>
                    <Link
                      to="/admin/sessions/$id"
                      params={{ id: s.bookingUid }}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                      View
                    </Link>
                    <MeetingButton url={s.meetingUrl} size="sm" />
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liveCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="group rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <p className="font-display text-base font-semibold text-foreground">{card.label}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{card.text}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}

        {soonCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-dashed border-border bg-card/60 p-6"
          >
            <p className="font-display text-base font-semibold text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">Coming Soon</p>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
