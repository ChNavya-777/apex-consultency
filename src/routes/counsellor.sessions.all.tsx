import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarIcon, Filter, RotateCcw, X } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import {
  CounsellorOutcomeActions,
  SessionEmptyState,
  SessionStatusBadge,
  StudentEmailLink,
} from "@/components/sessions/SessionUI";
import { SessionOutcomeModal } from "@/components/sessions/SessionOutcomeModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  formatSessionDate,
  isSessionCancelled,
  isSessionCompleted,
  sessionDateLabel,
  sessionSlot,
  sessionTimeLabel,
  type ConsultationSession,
  type CounsellorOutcome,
} from "@/lib/sessions";
import { useCounsellorPortalData } from "@/lib/use-portal-data";

export type CounsellorFilterStatus =
  | "all"
  | "upcoming"
  | "in_progress"
  | "awaiting_outcome"
  | "completed"
  | "missed"
  | "cancelled";

const statusFilterOptions: { value: CounsellorFilterStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_outcome", label: "Awaiting Outcome" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

/** Resolves unified display status for filtering & badges */
export function getSessionDisplayStatus(
  session: ConsultationSession,
  reference = new Date(),
): "upcoming" | "in_progress" | "awaiting_outcome" | "completed" | "missed" | "cancelled" {
  if (isSessionCancelled(session)) return "cancelled";
  if (session.counsellorOutcome === "missed") return "missed";
  if (session.counsellorOutcome === "completed") return "completed";

  const { start, end } = sessionSlot(session);
  const nowMs = reference.getTime();

  if (end && nowMs >= end.getTime()) {
    return "awaiting_outcome";
  }
  if (start && end && nowMs >= start.getTime() && nowMs < end.getTime()) {
    return "in_progress";
  }
  return "upcoming";
}

type SearchParams = {
  date?: string;
  status?: CounsellorFilterStatus;
};

const title = "All Sessions — APEX Global Education Portal";
const description = "Complete consultation session history and management.";

export const Route = createFileRoute("/counsellor/sessions/all")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    date: typeof search.date === "string" ? search.date : "all",
    status: ([
      "all",
      "upcoming",
      "in_progress",
      "awaiting_outcome",
      "completed",
      "missed",
      "cancelled",
    ].includes(search.status as string)
      ? search.status
      : "all") as CounsellorFilterStatus,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorAllSessionsPage,
});

function CounsellorAllSessionsPage() {
  const session = useRequireRole("counsellor");
  const { date = "all", status = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [targetOutcome, setTargetOutcome] = useState<CounsellorOutcome | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  /** Filtered on the server by the signed-in counsellor's login email. */
  const { data, isLoading } = useCounsellorPortalData(session?.email);

  const selectedDateObj = useMemo(() => {
    if (!date || date === "all") return undefined;
    const d = new Date(date.includes("T") ? date : `${date}T00:00:00`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [date]);

  const dateDisplayLabel = useMemo(() => {
    if (!date || date === "all") return "All Dates";
    if (selectedDateObj) {
      return formatSessionDate(date);
    }
    return date;
  }, [date, selectedDateObj]);

  const setDateFilter = (nextDate: string) => {
    navigate({ search: (prev) => ({ ...prev, date: nextDate }), replace: true });
  };

  const setStatusFilter = (nextStatus: CounsellorFilterStatus) => {
    navigate({ search: (prev) => ({ ...prev, status: nextStatus }), replace: true });
  };

  const resetFilters = () => {
    navigate({ search: { date: "all", status: "all" }, replace: true });
  };

  const filteredSessions = useMemo(() => {
    return data.sessions.filter((s) => {
      // 1. Status Filter
      if (status !== "all") {
        const displayStatus = getSessionDisplayStatus(s);
        if (displayStatus !== status) return false;
      }

      // 2. Date Filter
      if (date && date !== "all") {
        const { start } = sessionSlot(s);
        if (!start) return false;

        const sy = start.getFullYear();
        const sm = String(start.getMonth() + 1).padStart(2, "0");
        const sd = String(start.getDate()).padStart(2, "0");
        const sessionIsoDate = `${sy}-${sm}-${sd}`;
        const sessionLabel = sessionDateLabel(s);

        if (date !== sessionIsoDate && date !== sessionLabel) {
          if (selectedDateObj) {
            const sameDay =
              start.getFullYear() === selectedDateObj.getFullYear() &&
              start.getMonth() === selectedDateObj.getMonth() &&
              start.getDate() === selectedDateObj.getDate();
            if (!sameDay) return false;
          } else {
            return false;
          }
        }
      }

      return true;
    });
  }, [data.sessions, status, date, selectedDateObj]);

  if (!session) return null;

  const handleOpenOutcome = (s: ConsultationSession, outcome: CounsellorOutcome) => {
    setActiveSession(s);
    setTargetOutcome(outcome);
  };

  const hasActiveFilters = date !== "all" || status !== "all";

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading
        title="All Sessions"
        text="Complete consultation session history and management."
      />

      {/* Filter Controls Bar */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="h-4 w-4" /> Filter By:
            </div>

            {/* Calendar Date Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Date:</span>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{dateDisplayLabel}</span>
                    {date !== "all" && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateFilter("all");
                        }}
                        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Clear date filter"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b border-border flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-muted-foreground">Select Session Date</span>
                    {date !== "all" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDateFilter("all");
                          setCalendarOpen(false);
                        }}
                        className="text-xs text-brand-blue font-medium hover:underline"
                      >
                        Reset to All Dates
                      </button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={(d) => {
                      if (!d) {
                        setDateFilter("all");
                      } else {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        setDateFilter(`${y}-${m}-${day}`);
                      }
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="status-filter-select" className="text-xs font-medium text-muted-foreground">
                Status:
              </label>
              <select
                id="status-filter-select"
                value={status}
                onChange={(e) => setStatusFilter(e.target.value as CounsellorFilterStatus)}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {statusFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Session Cards & Empty States */}
      {filteredSessions.length === 0 ? (
        <SessionEmptyState
          title={
            isLoading
              ? "Loading your sessions…"
              : data.studentSourceError
                ? "Session Data Unavailable"
                : hasActiveFilters
                  ? "No sessions match selected filters"
                  : "No consultation history"
          }
          text={
            data.studentSourceError
              ? data.studentSourceError
              : hasActiveFilters
                ? `No sessions found matching Date "${dateDisplayLabel}" and Status "${status}". Try selecting different filter options.`
                : "Consultation sessions booked with you will appear here."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((s) => (
            <AllSessionCard
              key={s.bookingUid}
              session={s}
              onOpenOutcome={handleOpenOutcome}
            />
          ))}
        </div>
      )}

      {/* Outcome Modal */}
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

function AllSessionCard({
  session,
  onOpenOutcome,
}: {
  session: ConsultationSession;
  onOpenOutcome: (s: ConsultationSession, outcome: CounsellorOutcome) => void;
}) {
  const displayStatus = getSessionDisplayStatus(session);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-foreground">
            {session.studentName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            <StudentEmailLink email={session.studentEmail} />
          </p>
          {session.sessionName && (
            <p className="mt-0.5 text-xs text-muted-foreground">{session.sessionName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {session.rescheduled && (
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Session Rescheduled
            </span>
          )}
          <SessionStatusBadge status={displayStatus} />
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date
          </dt>
          <dd className="text-foreground">{sessionDateLabel(session)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time
          </dt>
          <dd className="text-foreground">{sessionTimeLabel(session)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Booking UID
          </dt>
          <dd className="truncate text-xs font-mono text-muted-foreground">
            {session.bookingUid}
          </dd>
        </div>
      </dl>

      {session.counsellorNotes && (
        <div className="mt-3 rounded-xl border border-border bg-surface/60 p-3 text-xs">
          <span className="font-semibold text-muted-foreground">Counsellor Notes: </span>
          <span className="text-foreground">{session.counsellorNotes}</span>
        </div>
      )}

      <div className="mt-4">
        <CounsellorOutcomeActions
          session={session}
          onOpenOutcome={onOpenOutcome}
        />
      </div>
    </article>
  );
}
