import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import {
  ApplicationTimeline,
  EmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

const title = "My Applications — APEX Student Portal";
const description = "Track your university applications with APEX Global Education.";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentApplicationsPage,
});

function StudentApplicationsPage() {
  const session = useRequireStudent();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Applications" text="Follow each application from shortlist to decision." />

      <div className="space-y-5">
        <EmptyState
          icon={GraduationCap}
          title="No applications yet"
          text="Your university applications will appear here once your application journey begins."
        />

        <StudentCard title="How your application journey works">
          <ApplicationTimeline note="Each application will move through these steps, and you'll see its current step here." />
        </StudentCard>
      </div>
    </StudentLayout>
  );
}
