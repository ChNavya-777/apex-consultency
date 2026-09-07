import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Compass, UserRound } from "lucide-react";
import { useMemo } from "react";
import {
  JourneyProgress,
  StudentCard,
  StudentHeading,
  StudentLayout,
  SupportCard,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { MeetingButton, SessionEmptyState, SessionStatusBadge } from "@/components/sessions/SessionUI";
import { isSessionUpcoming, sessionDateLabel, sessionTimeLabel, sessionSlot } from "@/lib/sessions";
import { useStudentPortalData } from "@/lib/use-portal-data";


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
  const { data, isLoading } = useStudentPortalData(session?.email);

  if (!session) return null;

  /** Earliest valid upcoming session for this student (same rules as My Sessions). */
  const nextSession = useMemo(() => {
    const upcoming = data.sessions
      .filter((s) => isSessionUpcoming(s))
      .sort((a, b) => {

        const startA = sessionSlot(a).start?.getTime();
        const startB = sessionSlot(b).start?.getTime();
        if (startA == null && startB == null) return 0;
        if (startA == null) return 1;
        if (startB == null) return -1;
        return startA - startB;
      });
    return upcoming[0];
  }, [data.sessions]);

  return (

    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading
        title="Welcome to your APEX Student Portal"
        text="Track your study abroad journey, consultations and application progress in one place."
      />

      <div className="space-y-5">
        <StudentCard title="Your Study Abroad Journey" icon={Compass}>
          <JourneyProgress note="Your journey will update as your counselling process progresses." />
        </StudentCard>

        <StudentCard
          title="Upcoming Consultation"
          icon={CalendarDays}
          action={
            <Link
              to="/student/sessions"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              My Sessions
            </Link>
          }
        >
          {nextSession ? (
            <div className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Counsellor
                  </p>
                  <p className="font-display text-base font-semibold text-foreground">
                    {nextSession.counsellorName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sessionDateLabel(nextSession)} · {sessionTimeLabel(nextSession)}
                  </p>

                </div>
                <SessionStatusBadge status={nextSession.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/student/sessions/$id"
                  params={{ id: nextSession.bookingUid }}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  View details
                </Link>
                <MeetingButton url={nextSession.meetingUrl} size="sm" />
              </div>
            </div>
          ) : (
            <SessionEmptyState
              title="No upcoming consultation"
              text="Your scheduled consultation will appear here once your booking is confirmed."
            />
          )}
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
