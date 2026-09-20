import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListTodo, AlertCircle, Calendar, ChevronRight, CheckSquare, GraduationCap } from "lucide-react";
import { EmptyState, PortalHeading, PortalLayout, PortalCard, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { CounsellorOutcomeActions, SessionCard, SessionEmptyState } from "@/components/sessions/SessionUI";
import { SessionOutcomeModal } from "@/components/sessions/SessionOutcomeModal";
import {
  isSessionAwaitingOutcome,
  isSessionCancelled,
  isSessionToday,
  isSessionUpcoming,
  type CounsellorOutcome,
  type ConsultationSession,
} from "@/lib/sessions";
import { useCounsellorPortalData, useCounsellorDashboardTasks, useCounsellorDashboardDeadlines } from "@/lib/use-portal-data";
import { StudentTable } from "@/components/portal/StudentTable";
import {
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueUpcoming,
  taskCategoryLabels,
  taskPriorityLabels,
  type StudentTask,
} from "@/lib/student-tasks";
import { applicationStatusLabels } from "@/lib/student-applications";

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
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [targetOutcome, setTargetOutcome] = useState<CounsellorOutcome | null>(null);

  /** Scoped on the server to this counsellor's login email only. */
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  const { tasks: allTasks, isLoading: isTasksLoading } = useCounsellorDashboardTasks(session?.email);
  const { deadlines, isLoading: isDeadlinesLoading } = useCounsellorDashboardDeadlines(session?.email);

  if (!session) return null;

  const firstName = session.name.split(" ")[0] ?? session.name;

  const mine = data.sessions;
  const awaitingOutcome = mine.filter((s) => isSessionAwaitingOutcome(s));
  const today = mine.filter((s) => isSessionToday(s) && !isSessionCancelled(s) && !s.rescheduled);
  const upcoming = mine.filter((s) => isSessionUpcoming(s));

  // Categorize Tasks for Dashboard
  const overdueTasks = allTasks.filter((t) => isTaskOverdue(t.dueAt, t.status));
  const dueTodayTasks = allTasks.filter((t) => isTaskDueToday(t.dueAt, t.status));
  const upcomingTasks = allTasks.filter((t) => isTaskDueUpcoming(t.dueAt, t.status));

  const totalActiveTasks = allTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  const handleOpenOutcome = (s: ConsultationSession, outcome: CounsellorOutcome) => {
    setActiveSession(s);
    setTargetOutcome(outcome);
  };

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading
        title={`Welcome, ${firstName} 👋`}
        text="Your consultation workspace"
        action={
          <Link
            to="/counsellor/sessions"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            View All Sessions
          </Link>
        }
      />

      {awaitingOutcome.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-amber-900 dark:text-amber-300">
              Awaiting Outcome ({awaitingOutcome.length})
            </h2>
            <span className="text-xs text-amber-800 dark:text-amber-400">
              Please record outcomes for completed consultations.
            </span>
          </div>
          <SessionList sessions={awaitingOutcome} onOpenOutcome={handleOpenOutcome} />
        </section>
      )}

      {/* Phase 4: Next Actions & Follow-ups Section */}
      <section className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-brand-blue" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Next Actions & Follow-ups ({totalActiveTasks})
            </h2>
          </div>
          {overdueTasks.length > 0 && (
            <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800 border border-rose-200">
              🚨 {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {totalActiveTasks === 0 ? (
          <PortalCard className="py-8 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isTasksLoading ? "Loading follow-up tasks..." : "No pending follow-up tasks."}
            </p>
            <p className="text-xs text-muted-foreground">
              Tasks created from student profiles will appear here for quick access.
            </p>
          </PortalCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Overdue Tasks Column */}
            {overdueTasks.length > 0 && (
              <PortalCard className="p-4 space-y-3 border-l-4 border-l-rose-500 bg-rose-50/20">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Overdue Tasks ({overdueTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 4).map((t) => (
                    <DashboardTaskItem key={t.id} task={t} />
                  ))}
                </div>
              </PortalCard>
            )}

            {/* Due Today Column */}
            {dueTodayTasks.length > 0 && (
              <PortalCard className="p-4 space-y-3 border-l-4 border-l-amber-500 bg-amber-50/20">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" /> Due Today ({dueTodayTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {dueTodayTasks.slice(0, 4).map((t) => (
                    <DashboardTaskItem key={t.id} task={t} />
                  ))}
                </div>
              </PortalCard>
            )}

            {/* Upcoming Tasks Column */}
            {upcomingTasks.length > 0 && (
              <PortalCard className="p-4 space-y-3 border-l-4 border-l-brand-blue bg-blue-50/20">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                    <ListTodo className="h-3.5 w-3.5" /> Upcoming (Next 7 Days) ({upcomingTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 4).map((t) => (
                    <DashboardTaskItem key={t.id} task={t} />
                  ))}
                </div>
              </PortalCard>
            )}
          </div>
        )}
      </section>

      {/* Phase 5: Upcoming Application Deadlines Section */}
      <section className="mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Upcoming Application Deadlines ({deadlines.length})
            </h2>
          </div>
        </div>

        {deadlines.length === 0 ? (
          <PortalCard className="py-6 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isDeadlinesLoading ? "Loading application deadlines..." : "No active application deadlines in the next 14 days."}
            </p>
            <p className="text-xs text-muted-foreground">
              Deadlines set on student applications will appear here automatically.
            </p>
          </PortalCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deadlines.map((d) => (
              <PortalCard
                key={d.id}
                className={`p-4 space-y-2 border-l-4 ${
                  d.isOverdue ? "border-l-rose-500 bg-rose-50/20" : "border-l-amber-500 bg-amber-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm truncate">{d.universityName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{d.courseName} • {d.intake}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                      d.isOverdue
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {d.isOverdue ? "OVERDUE" : "DUE SOON"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <Link
                    to="/counsellor/students/$id"
                    params={{ id: d.studentId }}
                    search={{ tab: "applications" }}
                    className="font-medium text-brand-blue hover:underline truncate"
                  >
                    {d.studentName}
                  </Link>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {new Date(d.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </PortalCard>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Today&apos;s Sessions
        </h2>
        {today.length === 0 ? (
          <SessionEmptyState
            title={isLoading ? "Loading your sessions…" : "No sessions scheduled today."}
            text="Sessions booked with you for today will appear here."
          />
        ) : (
          <SessionList sessions={today} onOpenOutcome={handleOpenOutcome} />
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Upcoming Sessions
        </h2>
        {upcoming.length === 0 ? (
          <SessionEmptyState
            title={isLoading ? "Loading your sessions…" : "No upcoming consultations."}
            text="Consultations booked with you will appear here."
          />
        ) : (
          <SessionList sessions={upcoming} onOpenOutcome={handleOpenOutcome} />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">My Students</h2>
        {data.students.length === 0 ? (
          <EmptyState
            title={isLoading ? "Loading your students…" : "No students assigned yet."}
            text="Students linked to your consultation sessions will appear here."
          />
        ) : (
          <StudentTable students={data.students} note={data.studentSourceError} />
        )}
      </section>

      {activeSession && targetOutcome && (
        <SessionOutcomeModal
          session={activeSession}
          targetOutcome={targetOutcome}
          isOpen={!!activeSession && !!targetOutcome}
          onClose={() => {
            setActiveSession(null);
            setTargetOutcome(null);
          }}
        />
      )}
    </PortalLayout>
  );
}

function DashboardTaskItem({
  task,
}: {
  task: StudentTask & { studentName: string; studentEmail: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-xs space-y-1.5 transition-all hover:border-brand-blue/40">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-foreground truncate" title={task.title}>
          {task.title}
        </h4>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
            task.priority === "urgent"
              ? "bg-rose-100 text-rose-800"
              : task.priority === "high"
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {taskPriorityLabels[task.priority] || task.priority}
        </span>
      </div>

      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/60">
        <Link
          to="/counsellor/students/$id"
          params={{ id: task.studentId }}
          search={{ tab: "tasks" }}
          className="font-medium text-brand-blue hover:underline truncate"
        >
          {task.studentName}
        </Link>

        {task.dueAt ? (
          <span className="shrink-0 font-mono text-[10px]">
            {new Date(task.dueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        ) : (
          <span className="text-[10px]">No deadline</span>
        )}
      </div>
    </div>
  );
}

function SessionList({
  sessions,
  onOpenOutcome,
}: {
  sessions: ConsultationSession[];
  onOpenOutcome: (session: ConsultationSession, outcome: CounsellorOutcome) => void;
}) {
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionCard
          key={s.bookingUid}
          session={s}
          actions={
            <CounsellorOutcomeActions
              session={s}
              onOpenOutcome={onOpenOutcome}
            />
          }
        />
      ))}
    </div>
  );
}
