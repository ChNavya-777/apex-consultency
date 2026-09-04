import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/data/site";
import { roleHome, signOut, useSession, type PortalSession } from "@/lib/portal-auth";

/* ------------------------------------------------------------------ */
/* Access control (prototype, client-side)                            */
/* ------------------------------------------------------------------ */

/**
 * Students may only ever render /student/* routes. Any other role that reaches a student route
 * is sent back to its own portal home, and signed-out visitors go to the student login.
 */
export function useRequireStudent(): PortalSession | undefined {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      navigate({ to: "/student/login", replace: true });
      return;
    }
    if (session.role !== "student") {
      navigate({ to: roleHome[session.role], replace: true });
    }
  }, [session, navigate]);

  return session && session.role === "student" ? session : undefined;
}

/* ------------------------------------------------------------------ */
/* Navigation                                                         */
/* ------------------------------------------------------------------ */

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  UserRound,
  CalendarDays,
  GraduationCap,
  FolderOpen,
  Bell,
  LifeBuoy,
  Settings,
};

export type StudentNavItem = {
  label: string;
  to: string;
  hash?: string;
  icon?: keyof typeof icons | string;
};

export function StudentSidebar({
  nav,
  session,
  onNavigate,
}: {
  nav: StudentNavItem[][];
  session: PortalSession;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function handleSignOut() {
    signOut();
    await navigate({ to: "/student/login", replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <StudentBrand />
      </div>

      <nav className="flex-1 space-y-5 px-3 pb-4 lg:px-4" aria-label="Student portal navigation">
        {nav.map((group, i) => (
          <div key={i} className={cn(i > 0 && "border-t border-border pt-5")}>
            <ul className="space-y-1">
              {group.map((item) => {
                const Icon = item.icon ? icons[item.icon] : undefined;
                const active =
                  !item.hash &&
                  (pathname === item.to || pathname.startsWith(`${item.to}/`));
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      {...(item.hash ? { hash: item.hash } : {})}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-blue/10 text-brand-blue"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground",
                      )}
                    >
                      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="truncate text-sm font-semibold text-foreground">Student</p>
        <p className="truncate text-xs text-muted-foreground">{session.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
      </div>
    </div>
  );
}

export function StudentHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <StudentBrand />
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-lg p-2 text-foreground transition-colors hover:bg-surface"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}

export function StudentBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-deep">
        <GraduationCap className="h-5 w-5 text-gold" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold tracking-wide text-foreground">
          APEX
        </span>
        <span className="block text-[11px] text-muted-foreground">Global Education</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export function StudentLayout({
  session,
  nav,
  children,
}: {
  session: PortalSession;
  nav: StudentNavItem[][];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[17rem_1fr]">
      <StudentHeader onOpenMenu={() => setOpen(true)} />

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        <StudentSidebar nav={nav} session={session} />
      </aside>

      {/* Mobile slide-out */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-navy-deep/50 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[17rem] max-w-[85%] bg-card shadow-lift transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-4 rounded-lg p-2 text-muted-foreground hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
          <StudentSidebar nav={nav} session={session} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <main className="min-w-0 px-4 py-7 sm:px-6 md:px-10 md:py-12">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                    */
/* ------------------------------------------------------------------ */

export function StudentHeading({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[1.6rem] font-bold leading-tight tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {text && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function StudentCard({
  title,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Icon = icon;
  return (
    <section
      className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6", className)}
    >
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            {Icon && <Icon className="h-[18px] w-[18px] text-brand-blue" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  text,
  icon,
  className,
}: {
  title: string;
  text?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const Icon = icon;
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function SessionEmptyState({
  title = "No upcoming consultation",
  text = "Your scheduled consultation will appear here once your booking is confirmed.",
}: {
  title?: string;
  text?: string;
}) {
  return <EmptyState icon={CalendarDays} title={title} text={text} />;
}

/* ------------------------------------------------------------------ */
/* Journey                                                            */
/* ------------------------------------------------------------------ */

export type StageStatus = "not_started" | "in_progress" | "completed" | "action_required";

export type JourneyStage = { label: string; status?: StageStatus };

/** Canonical study-abroad journey. Statuses stay undefined until real data is connected. */
export const journeyStages: JourneyStage[] = [
  { label: "Consultation" },
  { label: "Profile Evaluation" },
  { label: "University Shortlisting" },
  { label: "Application" },
  { label: "Offer" },
  { label: "Visa" },
  { label: "Pre-Departure" },
];

const statusStyles: Record<StageStatus, { dot: string; text: string; label: string }> = {
  not_started: { dot: "bg-muted text-muted-foreground", text: "text-muted-foreground", label: "Not started" },
  in_progress: { dot: "bg-brand-blue/15 text-brand-blue", text: "text-foreground", label: "In progress" },
  completed: { dot: "bg-brand-blue text-primary-foreground", text: "text-foreground", label: "Completed" },
  action_required: { dot: "bg-gold/20 text-gold-deep", text: "text-foreground", label: "Action required" },
};

export function JourneyProgress({
  stages = journeyStages,
  note,
}: {
  stages?: JourneyStage[];
  note?: string;
}) {
  return (
    <div>
      <div className="relative">
        {/* Connector rail, sits behind the stage markers on wider screens. */}
        <span
          aria-hidden
          className="absolute left-[7%] right-[7%] top-4 hidden h-px bg-border md:block"
        />
        <ol className="relative space-y-3 md:grid md:auto-cols-fr md:grid-flow-col md:gap-2 md:space-y-0">
          {stages.map((stage) => {
            const style = statusStyles[stage.status ?? "not_started"];
            const done = stage.status === "completed";
            return (
              <li
                key={stage.label}
                className="flex items-center gap-3 md:min-w-0 md:flex-col md:items-center md:gap-0 md:text-center"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card transition-colors",
                    style.dot,
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : stage.status === "in_progress" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="min-w-0 md:mt-2.5 md:px-1">
                  <span className={cn("block text-sm font-medium", style.text)}>{stage.label}</span>
                  {stage.status && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{style.label}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {note && (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data-shaped presentational components (no data wired yet)          */
/* ------------------------------------------------------------------ */

export type FieldGroup = { heading: string; fields: string[] };

export function ProfileCard({
  groups,
  emptyText,
  values,
}: {
  groups: FieldGroup[];
  emptyText?: string;
  /** Field label → value from the source. Missing/blank values render as "Not available". */
  values?: Record<string, string | null | undefined>;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.heading}
          </h3>
          <dl className="rounded-xl border border-border bg-surface/50 px-4">
            {group.fields.map((field) => {
              const value = values?.[field]?.trim() || "";
              return (
                <div
                  key={field}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0"
                >
                  <dt className="text-sm text-muted-foreground">{field}</dt>
                  <dd
                    className={cn(
                      "max-w-[60%] break-words text-right text-sm",
                      value ? "font-medium text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {value || (values ? "Not available" : "Not available yet")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
      {emptyText && <p className="text-sm text-muted-foreground">{emptyText}</p>}
    </div>
  );
}


export type SessionSummary = {
  id: string;
  counsellor: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetingUrl?: string;
};

/** Ready for real session data; renders nothing fabricated. */
export function SessionCard({ session }: { session: SessionSummary }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-foreground">
            {session.counsellor}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.date} · {session.startTime} – {session.endTime}
          </p>
        </div>
        <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-blue">
          {session.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/student/sessions/$id"
          params={{ id: session.id }}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          View details
        </Link>
        {session.meetingUrl && (
          <a
            href={session.meetingUrl}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-blue/90"
          >
            Join Meeting
          </a>
        )}
      </div>
    </article>
  );
}

export function ApplicationTimeline({ note }: { note?: string }) {
  const steps = [
    "University Shortlisting",
    "Application Submitted",
    "Application Under Review",
    "Offer Received",
    "Decision",
  ];
  return (
    <div>
      <ol className="space-y-3 md:flex md:space-y-0 md:gap-3">
        {steps.map((step) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3 md:min-w-0 md:flex-1 md:flex-col md:items-start"
          >
            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
      {note && <p className="mt-5 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

export function DocumentCard({ category, text }: { category: string; text?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
        <FolderOpen className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{category}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{text ?? "No documents available"}</p>
      </div>
    </div>
  );
}

export function NotificationItem({
  title,
  text,
  time,
}: {
  title: string;
  text?: string;
  time?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-4 last:border-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
        <Bell className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {text && <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>}
        {time && <p className="mt-1 text-xs text-muted-foreground/70">{time}</p>}
      </div>
    </div>
  );
}

/** Reuses the public site's existing contact details — nothing new invented. */
export function SupportCard({ id }: { id?: string }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-soft md:p-6"
    >
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
        <LifeBuoy className="h-[18px] w-[18px] text-brand-blue" /> Need Help?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Our team is happy to help with your consultation, application or documents.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          to="/contact"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-blue/90"
        >
          <MessageCircle className="h-4 w-4" /> Contact APEX
        </Link>
        <a
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          <Phone className="h-4 w-4" /> Call Support
        </a>
        <a
          href={`mailto:${site.email}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          <Mail className="h-4 w-4" /> Email Support
        </a>
      </div>
    </section>
  );
}
