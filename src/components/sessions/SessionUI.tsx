/**
 * Reusable consultation-session presentation layer.
 *
 * These components are purely presentational: they never fabricate data. Session data comes
 * from `@/lib/sessions`, which stays empty until the real booking source is connected.
 */

import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, Video, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  canRecordSessionOutcome,
  isSessionCancelled,
  isValidMeetingUrl,
  sessionDateLabel,
  sessionSlot,
  sessionStatusLabels,
  sessionTimeLabel,
  type ConsultationSession,
  type CounsellorOutcome,
  type SessionStatus,
} from "@/lib/sessions";

/* ------------------------------------------------------------------ */
/* Status badge                                                       */
/* ------------------------------------------------------------------ */

const statusStyles: Record<SessionStatus, string> = {
  upcoming: "bg-brand-blue/10 text-brand-blue",
  in_progress: "bg-gold/20 text-gold-deep",
  completed: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-amber-500/10 text-amber-700",
  awaiting_outcome: "bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
};

export function SessionStatusBadge({ status }: { status?: SessionStatus | undefined }) {
  if (!status) {
    return <span className="text-sm text-muted-foreground/60">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {sessionStatusLabels[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Student email — contact link (the stored/normalised value is unchanged) */
/* ------------------------------------------------------------------ */

export function StudentEmailLink({ email }: { email: string }) {
  if (!email) return <>—</>;
  return (
    <a href={`mailto:${email}`} className="hover:underline">
      {email}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Meeting button — renders only for a valid URL                      */
/* ------------------------------------------------------------------ */

export function MeetingButton({
  url,
  size = "md",
  className,
}: {
  url?: string | null | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
}) {
  if (!isValidMeetingUrl(url)) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue font-semibold text-primary-foreground transition-colors hover:bg-brand-blue/90",
        size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
        className,
      )}
    >
      <Video className="h-4 w-4" /> Join Meeting
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

export function SessionEmptyState({
  title = "No consultation sessions yet",
  text = "Scheduled consultations will appear here once your booking system is connected.",
  action,
  className,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-12 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card text-muted-foreground">
        <CalendarDays className="h-5 w-5" />
      </span>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters                                                            */
/* ------------------------------------------------------------------ */

export type SessionFilterState = {
  search: string;
  date: string;
  status: SessionStatus | "all";
  counsellor: string;
};

export const emptySessionFilters: SessionFilterState = {
  search: "",
  date: "",
  status: "all",
  counsellor: "all",
};

const fieldClass =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SessionFilters({
  value,
  onChange,
  counsellors,
}: {
  value: SessionFilterState;
  onChange: (next: SessionFilterState) => void;
  counsellors: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search</span>
        <input
          type="search"
          placeholder="Student, email or booking UID"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Date</span>
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Status</span>
        <select
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as SessionFilterState["status"] })}
          className={fieldClass}
        >
          <option value="all">All statuses</option>
          {(Object.keys(sessionStatusLabels) as SessionStatus[]).map((s) => (
            <option key={s} value={s}>
              {sessionStatusLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Counsellor</span>
        <select
          value={value.counsellor}
          onChange={(e) => onChange({ ...value, counsellor: e.target.value })}
          className={fieldClass}
        >
          <option value="all">All counsellors</option>
          {counsellors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table (desktop) + cards (mobile)                                   */
/* ------------------------------------------------------------------ */

const adminColumns = [
  "Booking UID",
  "Student",
  "Email",
  "Counsellor",
  "Date",
  "Start Time",
  "End Time",
  "Status",
  "Action",
];

export function SessionTable({
  sessions,
  renderView,
  empty,
}: {
  sessions: ConsultationSession[];
  /** Route-typed "View" link supplied by the calling route. */
  renderView: (session: ConsultationSession) => ReactNode;
  empty: ReactNode;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {adminColumns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={adminColumns.length} className="px-4 py-4">
                    {empty}
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.bookingUid} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {s.bookingUid}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{s.studentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      <StudentEmailLink email={s.studentEmail} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{s.counsellorName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{sessionDateLabel(s)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{startTimeLabel(s)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{endTimeLabel(s)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <SessionStatusBadge status={s.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        {renderView(s)}
                        <MeetingButton url={s.meetingUrl} size="sm" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sessions.length === 0
          ? empty
          : sessions.map((s) => (
              <SessionCard
                key={s.bookingUid}
                session={s}
                showCounsellor
                actions={
                  <>
                    {renderView(s)}
                    <MeetingButton url={s.meetingUrl} size="sm" />
                  </>
                }
              />
            ))}
      </div>
    </>
  );
}

/** Slot start only — "—" when the source has no parseable time. */
function startTimeLabel(session: ConsultationSession) {
  const label = sessionTimeLabel(session);
  return label.split(" – ")[0] ?? label;
}

/** Slot end only — "—" when the source does not provide a distinct end time. */
function endTimeLabel(session: ConsultationSession) {
  const parts = sessionTimeLabel(session).split(" – ");
  return parts.length > 1 ? parts[1] : "—";
}

/* ------------------------------------------------------------------ */
/* Session card                                                       */
/* ------------------------------------------------------------------ */

export function SessionCard({
  session,
  actions,
  showCounsellor = false,
}: {
  session: ConsultationSession;
  actions?: ReactNode;
  showCounsellor?: boolean;
}) {
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
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
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
        {showCounsellor && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Counsellor
            </dt>
            <dd className="text-foreground">{session.counsellorName}</dd>
          </div>
        )}
      </dl>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Detail                                                             */
/* ------------------------------------------------------------------ */

export function SessionDetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6">
      <h2 className="mb-4 font-display text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  );
}

/** Shared detail body. `audience` controls which internal fields are shown. */
export function SessionDetail({
  session,
  audience,
  studentAction,
  outcomeAction,
}: {
  session: ConsultationSession;
  audience: "admin" | "counsellor" | "student";
  studentAction?: ReactNode;
  outcomeAction?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <SessionDetailSection title={audience === "student" ? "Consultation" : "Booking Information"}>
        <dl>
          {session.sessionName && <DetailRow label="Session" value={session.sessionName} />}
          <DetailRow label="Booking UID" value={session.bookingUid} />
          <DetailRow label="Session Status" value={<SessionStatusBadge status={session.status} />} />
          {session.counsellorOutcome && (
            <DetailRow
              label="Counsellor Outcome"
              value={
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    session.counsellorOutcome === "completed"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700",
                  )}
                >
                  {session.counsellorOutcome === "completed" ? "Completed" : "Missed"}
                </span>
              }
            />
          )}
          {session.bookingStatus && (
            <DetailRow label="Booking Status" value={session.bookingStatus} />
          )}
          {session.inviteeStatus && (
            <DetailRow label="Invitee Status" value={session.inviteeStatus} />
          )}
        </dl>
      </SessionDetailSection>

      {session.counsellorOutcome && session.counsellorNotes && (
        <SessionDetailSection title="Counsellor Session Notes">
          <p className="whitespace-pre-wrap text-sm text-foreground">{session.counsellorNotes}</p>
        </SessionDetailSection>
      )}

      {outcomeAction && (
        <SessionDetailSection title="Session Outcome">
          {outcomeAction}
        </SessionDetailSection>
      )}

      {audience !== "student" && (
        <SessionDetailSection title="Student">
          <dl>
            <DetailRow label="Student Name" value={session.studentName} />
            <DetailRow
              label="Student Email"
              value={<StudentEmailLink email={session.studentEmail} />}
            />
          </dl>
          {studentAction && <div className="mt-4">{studentAction}</div>}
        </SessionDetailSection>
      )}

      <SessionDetailSection title="Counsellor">
        <dl>
          <DetailRow
            label={audience === "student" ? "Counsellor Name" : "Assigned Counsellor"}
            value={session.counsellorName}
          />
          {audience !== "counsellor" && session.counsellorEmail && (
            <DetailRow
              label="Counsellor Email"
              value={
                <a href={`mailto:${session.counsellorEmail}`} className="hover:underline">
                  {session.counsellorEmail}
                </a>
              }
            />
          )}
        </dl>
      </SessionDetailSection>

      <SessionDetailSection title="Schedule">
        <dl>
          <DetailRow label="Date" value={sessionDateLabel(session)} />
          <DetailRow label="Start Time" value={startTimeLabel(session)} />
          <DetailRow label="End Time" value={endTimeLabel(session)} />
          {session.timezone && <DetailRow label="Timezone" value={session.timezone} />}
        </dl>
      </SessionDetailSection>

      {(session.questionsAndAnswers?.length ?? 0) > 0 && (
        <SessionDetailSection title="Booking Questions">
          <dl>
            {session.questionsAndAnswers?.map((qa, i) => (
              <DetailRow key={`${qa.question}-${i}`} label={qa.question || "Answer"} value={qa.answer || "—"} />
            ))}
          </dl>
        </SessionDetailSection>
      )}

      {(session.rescheduleUrl || session.cancelUrl) && sessionSlot(session).start && (
        <SessionDetailSection title="Manage Booking">
          <div className="flex flex-wrap gap-2">
            {session.rescheduleUrl && (
              <a
                href={session.rescheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Reschedule
              </a>
            )}
            {session.cancelUrl && (
              <a
                href={session.cancelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface"
              >
                Cancel
              </a>
            )}
          </div>
        </SessionDetailSection>
      )}

      {isValidMeetingUrl(session.meetingUrl) && (
        <SessionDetailSection title="Meeting">
          <MeetingButton url={session.meetingUrl} />
        </SessionDetailSection>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Counsellor card outcome action buttons                             */
/* ------------------------------------------------------------------ */

export function CounsellorOutcomeActions({
  session,
  onOpenOutcome,
  showViewStudent = false,
}: {
  session: ConsultationSession;
  onOpenOutcome?: (s: ConsultationSession, outcome: CounsellorOutcome) => void;
  showViewStudent?: boolean;
}) {
  const isCancelled = isSessionCancelled(session);
  const isRescheduled = !!session.rescheduled;
  const outcome = session.counsellorOutcome;

  const canMutate = canRecordSessionOutcome(session);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canMutate && onOpenOutcome && (
        <>
          <button
            type="button"
            onClick={() => onOpenOutcome(session, "completed")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </button>
          <button
            type="button"
            onClick={() => onOpenOutcome(session, "missed")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 shadow-sm"
          >
            <XCircle className="h-4 w-4" />
            Missed
          </button>
        </>
      )}

      {outcome === "completed" && (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Completed
        </span>
      )}

      {outcome === "missed" && (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 text-xs font-semibold text-amber-700">
          <XCircle className="h-4 w-4 text-amber-600" /> Missed
        </span>
      )}

      {!outcome && isRescheduled && (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 text-xs font-semibold text-amber-700">
          Session Rescheduled
        </span>
      )}

      {!outcome && isCancelled && (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-destructive/10 px-3 text-xs font-semibold text-destructive">
          Cancelled
        </span>
      )}

      <Link
        to="/counsellor/sessions/$id"
        params={{ id: session.bookingUid }}
        className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
      >
        View details
      </Link>

      {showViewStudent && (
        <Link
          to="/counsellor/students"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          View Student
        </Link>
      )}

      <MeetingButton url={session.meetingUrl} size="sm" />
    </div>
  );
}
