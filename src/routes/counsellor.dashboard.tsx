import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";

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

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title={`Welcome, ${firstName} 👋`} text="Your consultation workspace" />

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Today&apos;s Sessions
        </h2>
        <EmptyState title="No sessions available yet." />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">My Students</h2>
        <EmptyState title="Student information will appear here once consultation data is connected." />
      </section>
    </PortalLayout>
  );
}
