import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import {
  EmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
  type SessionSummary,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

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

const fields = [
  "Booking UID",
  "Student Name",
  "Student Email",
  "Counsellor",
  "Start Time",
  "End Time",
  "Meeting URL",
];

function StudentSessionDetailPage() {
  const session = useRequireStudent();
  if (!session) return null;

  /**
   * Session lookup is intentionally not implemented yet: sessions will be fetched for the
   * signed-in student only, so one student can never load another student's session.
   */
  const record: SessionSummary | null = null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <Link
        to="/student/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my sessions
      </Link>

      <StudentHeading title="Consultation Details" />

      {record ? null : (
        <div className="space-y-5">
          <EmptyState
            icon={CalendarDays}
            title="This session isn't available yet"
            text="Consultation details will appear here once your booking information is connected."
          />

          <StudentCard title="What you'll see here">
            <dl className="rounded-xl border border-border bg-surface/50 px-4">
              {fields.map((field) => (
                <div
                  key={field}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0"
                >
                  <dt className="text-sm text-muted-foreground">{field}</dt>
                  <dd className="text-sm text-muted-foreground/60">Not available yet</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              A <span className="font-medium text-foreground">Join Meeting</span> button appears
              here as soon as a meeting link is available for your session.
            </p>
          </StudentCard>
        </div>
      )}
    </StudentLayout>
  );
}
