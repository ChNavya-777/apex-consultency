import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { SessionDetail, SessionEmptyState } from "@/components/sessions/SessionUI";
import { findSession } from "@/lib/sessions";
import { useCounsellorPortalData } from "@/lib/use-portal-data";

const title = "Consultation Details — APEX Global Education Portal";
const description = "Details of a consultation assigned to you.";

export const Route = createFileRoute("/counsellor/sessions/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorSessionDetailPage,
});

function CounsellorSessionDetailPage() {
  const session = useRequireRole("counsellor");
  const { id } = Route.useParams();
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  if (!session) return null;

  /** Looked up only within this counsellor's own (server-filtered) sessions. */
  const record = findSession(data.sessions, id);

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <Link
        to="/counsellor/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my sessions
      </Link>

      <PortalHeading title="Consultation Details" />

      {record ? (
        <SessionDetail
          session={record}
          audience="counsellor"
          studentAction={
            <Link
              to="/counsellor/students"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              View Student
            </Link>
          }
        />
      ) : (
        <SessionEmptyState
          title={isLoading ? "Loading consultation…" : "Consultation not found"}
          text="This session isn't available to you."
          action={
            <Link
              to="/counsellor/sessions"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Back to my sessions
            </Link>
          }
        />
      )}
    </PortalLayout>
  );
}
