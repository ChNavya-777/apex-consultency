import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { cn } from "@/lib/utils";
import { roleHome, roleLogin, signOut, useSession, type PortalRole, type PortalSession } from "@/lib/portal-auth";

/* ------------------------------------------------------------------ */
/* Access control (prototype, client-side)                            */
/* ------------------------------------------------------------------ */

export function useRequireRole(role: PortalRole): PortalSession | undefined {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      navigate({ to: roleLogin[role], replace: true });
      return;
    }
    if (session.role !== role) {
      navigate({ to: roleHome[session.role], replace: true });
    }
  }, [session, role, navigate]);

  return session && session.role === role ? session : undefined;
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export type NavItem = { label: string; to?: string; soon?: boolean };

export function PortalLayout({
  session,
  nav,
  children,
}: {
  session: PortalSession;
  nav: NavItem[][];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  function handleSignOut() {
    signOut();
    navigate({
      to: session.role === "super_admin" ? "/admin/login" : "/counsellor/login",
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-border bg-navy-deep px-4 py-3 text-primary-foreground lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-md p-2 hover:bg-white/10"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "border-r border-white/10 bg-navy-deep text-primary-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
          open ? "block" : "hidden lg:block",
        )}
      >
        <div className="hidden px-6 py-6 lg:block">
          <Brand />
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4 lg:px-4" aria-label="Portal navigation">
          {nav.map((group, i) => (
            <div key={i} className={cn(i > 0 && "border-t border-white/10 pt-5")}>
              <ul className="space-y-1">
                {group.map((item) => (
                  <li key={item.label}>
                    {item.to && !item.soon ? (
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          pathname === item.to || pathname.startsWith(`${item.to}/`)
                            ? "bg-white/12 text-primary-foreground"
                            : "text-primary-foreground/70 hover:bg-white/8 hover:text-primary-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-primary-foreground/45">
                        {item.label}
                        <em className="not-italic text-[10px] font-semibold uppercase tracking-wide text-gold/70">
                          Soon
                        </em>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-semibold">{session.name}</p>
          <p className="truncate text-xs text-primary-foreground/60">{session.email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-primary-foreground"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <GraduationCap className="h-6 w-6 text-gold" />
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold tracking-wide">APEX</span>
        <span className="block text-[11px] text-primary-foreground/60">Global Education</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                    */
/* ------------------------------------------------------------------ */

export function PortalHeading({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {text && <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function PortalCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        active ? "bg-brand-blue/10 text-brand-blue" : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login card                                                         */
/* ------------------------------------------------------------------ */

export function PortalLogin({
  title,
  subtitle,
  onSubmit,
  footer,
}: {
  title: string;
  subtitle: string;
  onSubmit: (email: string, password: string) => boolean;
  footer?: ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center text-primary-foreground">
          <Brand />
        </div>
        <div className="rounded-2xl border border-border bg-card p-7 shadow-lift md:p-8">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const ok = onSubmit(email.trim(), password);
              if (!ok) setError("Incorrect email or password. Please try again.");
              else setError(null);
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Password
              </span>
              <PasswordInput
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
