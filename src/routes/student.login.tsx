import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInStudent, startStudentSession } from "@/lib/portal-auth";
import { createStudentAccount, studentLogin } from "@/lib/student-auth.functions";
import { site } from "@/data/site";

const title = "Student Login — APEX Global Education Portal";
const description = "Sign in to the APEX Global Education Student Portal to view your study abroad journey.";

export const Route = createFileRoute("/student/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: "/consultation" } =>
    search["redirect"] === "/consultation" ? { redirect: "/consultation" } : {},
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentLoginPage,
});

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function StudentLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const afterSignIn = redirect === "/consultation" ? "/consultation" : "/student/dashboard";
  const login = useServerFn(studentLogin);
  const createAccount = useServerFn(createStudentAccount);

  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Create-account fields (password values are dropped as soon as the request completes).
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-deep">
            <GraduationCap className="h-6 w-6 text-gold" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
            APEX Global Education
          </h1>
          <p className="mt-1 font-display text-sm font-semibold text-brand-blue">Student Portal</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to view your study abroad journey."
              : "Create your student account to get started."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lift md:p-7">
          {mode === "signin" ? (
            <>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  setError(null);

                  // Existing prototype test account keeps working unchanged.
                  const local = signInStudent(email.trim(), password);
                  if (local) {
                    setPassword("");
                    void navigate({ to: "/student/dashboard", replace: true });
                    return;
                  }

                  setBusy(true);
                  try {
                    const result = await login({
                      data: { email: email.trim(), password },
                    });
                    if (!result.success) {
                      setError(result.message);
                      return;
                    }
                    startStudentSession(result.name, result.email);
                    setPassword("");
                    void navigate({ to: "/student/dashboard", replace: true });
                  } catch {
                    setError("Invalid email or password.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="block">
                  <span className={labelClass}>Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Password</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </label>

                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? "Signing in…" : "Sign In"}
                </Button>
              </form>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link to="/contact" className="font-medium text-brand-blue hover:underline">
                  Forgot Password?
                </Link>
                <button
                  type="button"
                  onClick={() => setHelpOpen((v) => !v)}
                  className="font-medium text-brand-blue hover:underline"
                  aria-expanded={helpOpen}
                >
                  Need Help?
                </button>
              </div>

              {helpOpen && (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground">
                  <p>
                    Student accounts are issued by your APEX counsellor. If you can&apos;t sign in,
                    reach out to us:
                  </p>
                  <p className="mt-2">
                    <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="font-medium text-brand-blue hover:underline">
                      {site.phone}
                    </a>
                    {" · "}
                    <a href={`mailto:${site.email}`} className="font-medium text-brand-blue hover:underline">
                      {site.email}
                    </a>
                  </p>
                </div>
              )}

              <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("create");
                  }}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  Create Account
                </button>
              </p>
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setCreateError(null);

                const name = newName.trim();
                const mail = newEmail.trim().toLowerCase();
                if (!name) return setCreateError("Please enter your full name.");
                if (!emailPattern.test(mail)) return setCreateError("Enter a valid email address.");
                if (newPassword.length < 6)
                  return setCreateError("Password must be at least 6 characters.");
                if (newPassword !== confirmPassword)
                  return setCreateError("Passwords do not match.");

                setBusy(true);
                try {
                  const result = await createAccount({
                    data: { fullName: name, email: mail, password: newPassword },
                  });
                  if (!result.success) {
                    setCreateError(result.message);
                    return;
                  }
                  startStudentSession(result.name, result.email);
                  setNewPassword("");
                  setConfirmPassword("");
                  void navigate({ to: "/consultation" });
                } catch {
                  setCreateError(
                    "Unable to create this account. Please check your details or use another email.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="block">
                <span className={labelClass}>Full Name</span>
                <input
                  required
                  autoComplete="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Confirm Password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </label>

              {createError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {createError}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Creating account…" : "Create Account"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setMode("signin");
                }}
                className="h-11 w-full rounded-xl border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

