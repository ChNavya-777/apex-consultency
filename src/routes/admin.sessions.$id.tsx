import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import { SessionDetail, SessionEmptyState } from "@/components/sessions/SessionUI";
import { findSession } from "@/lib/sessions";
import { useAdminPortalData } from "@/lib/use-portal-data";

const title = "Consultation Details — APEX Global Education Portal";
const description = "Full details of a scheduled student consultation.";

export const Route = createFileRoute("/admin/sessions/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSessionDetailPage,
});

function AdminSessionDetailPage() {
  const session = useRequireRole("super_admin");
  const { id } = Route.useParams();
  const { data } = useAdminPortalData();
  if (!session) return null;

  const record = findSession(data.sessions, id);

  return (
    <PortalLayout session={session} nav={adminNav}>
      <Link
        to="/admin/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </Link>

      <PortalHeading title="Consultation Details" />

      {record ? (
        <SessionDetail
          session={record}
          audience="admin"
          /**
           * A "View Student" action appears only when a matching student record exists.
           * No student records exist in this phase, so nothing is rendered.
           */
          studentAction={null}
        />
      ) : (
        <SessionEmptyState
          title="Consultation not found"
          text="This session isn't available. Consultation records will appear here once your booking system is connected."
          action={
            <Link
              to="/admin/sessions"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Back to sessions
            </Link>
          }
        />
      )}
    </PortalLayout>
  );
}
