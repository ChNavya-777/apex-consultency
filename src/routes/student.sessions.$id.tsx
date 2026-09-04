import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { StudentHeading, StudentLayout, useRequireStudent } from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { SessionDetail, SessionEmptyState } from "@/components/sessions/SessionUI";
import { findSession } from "@/lib/sessions";
import { useStudentPortalData } from "@/lib/use-portal-data";

const title = "Consultation Details — APEX Student Portal";
const description = "Details of your APEX consultation session.";

export const Route = createFileRoute("/student/sessions/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentSessionDetailPage,
});

function StudentSessionDetailPage() {
  const session = useRequireStudent();
  const { id } = Route.useParams();
  const { data, isLoading } = useStudentPortalData(session?.email);
  if (!session) return null;

  /**
   * Looked up only within the signed-in student's own sessions (already filtered server-side),
   * so one student can never load another student's consultation.
   */
  const record = findSession(data.sessions, id);

  return (
    <StudentLayout session={session} nav={studentNav}>
      <Link
        to="/student/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my sessions
      </Link>

      <StudentHeading title="Consultation Details" />

      {record ? (
        <SessionDetail session={record} audience="student" />
      ) : (
        <SessionEmptyState
          title={isLoading ? "Loading this consultation…" : "This consultation isn't available yet"}
          text="Your consultation details will appear here once your booking is confirmed."
          action={
            <Link
              to="/student/sessions"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Back to my sessions
            </Link>
          }
        />
      )}
    </StudentLayout>
  );
}
