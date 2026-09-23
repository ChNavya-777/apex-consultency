import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Compass, UserRound, ListTodo } from "lucide-react";
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
import {
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
  isTaskOverdue,
} from "@/lib/student-tasks";


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
  const { data } = useStudentPortalData(session?.email);


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

  if (!session) return null;

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
              text="Ready to speak with our counselling team?"
              action={
                <Link
                  to="/consultation"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-blue/90"
                >
                  <CalendarPlus className="h-4 w-4" /> Book a Consultation
                </Link>
              }
            />
          )}
        </StudentCard>

        <StudentCard title="Action Items & Counsellor Follow-ups" icon={ListTodo}>
          {data.tasks && data.tasks.length > 0 ? (
            <div className="space-y-3">
              {data.tasks.map((task) => {
                const overdue = isTaskOverdue(task.dueAt, task.status);
                const isCompleted = task.status === "completed";

                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/20 opacity-75"
                        : overdue
                        ? "border-rose-500/30 bg-rose-500/10"
                        : "border-border bg-surface/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-display text-sm font-semibold ${
                              isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                            {taskCategoryLabels[task.category] || task.category}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                              task.priority === "urgent"
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold"
                                : task.priority === "high"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {taskPriorityLabels[task.priority] || task.priority}
                          </span>
                          {overdue && (
                            <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                          <span>Assigned by: <strong className="text-foreground">{task.createdByCounsellorName}</strong></span>
                          {task.dueAt && (
                            <span className={overdue ? "font-semibold text-rose-400" : ""}>
                              Due: {new Date(task.dueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          task.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : task.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {taskStatusLabels[task.status] || task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No pending follow-ups or action items assigned.</p>
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
