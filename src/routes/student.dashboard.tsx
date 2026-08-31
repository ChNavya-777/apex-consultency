import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Compass, UserRound } from "lucide-react";
import {
  JourneyProgress,
  SessionEmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  SupportCard,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

const title = "Dashboard — APEX Student Portal";
const description = "Track your study abroad journey, consultations and application progress in one place.";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const session = useRequireStudent();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading
        title="Welcome to your APEX Student Portal"
        text="Track your study abroad journey, consultations and application progress in one place."
      />

      <div className="space-y-5">
        <StudentCard title="Your Study Abroad Journey" icon={Compass}>
          <JourneyProgress note="Your journey status will appear here once your consultation information is connected." />
        </StudentCard>

        <StudentCard title="Upcoming Consultation" icon={CalendarDays}>
          <SessionEmptyState />
        </StudentCard>

        <StudentCard
          title="My Profile"
          icon={UserRound}
          action={
            <Link
              to="/student/profile"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              View Profile
            </Link>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {["Personal Information", "Academic Information", "Study Preferences", "Additional Information"].map(
              (group) => (
                <div key={group} className="rounded-xl border border-border bg-surface/50 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{group}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Not available yet</p>
                </div>
              ),
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Profile information will appear here once your enquiry is connected.
          </p>
        </StudentCard>

        <SupportCard />
      </div>
    </StudentLayout>
  );
}
