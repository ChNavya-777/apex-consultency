import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";

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

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading
        title="Welcome, Admin"
        text="Manage your APEX Global Education operations from one place."
      />

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
