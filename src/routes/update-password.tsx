import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap } from "lucide-react";

const title = "Update Password — APEX Global Education Portal";
const description = "Set a new password for your APEX portal account.";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session);
    });

    // Listen for auth state events (specifically PASSWORD_RECOVERY)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password.");
      return;
    }

    setBusy(true);

    try {
      const { error: sbError } = await supabase.auth.updateUser({
        password,
      });

      if (sbError) {
        setError(sbError.message || "Failed to update password. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center text-primary-foreground">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-gold" />
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold tracking-wide">APEX</span>
              <span className="block text-[11px] text-primary-foreground/60">Global Education</span>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-lift md:p-8">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            Set New Password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create a secure new password for your account.
          </p>

          {hasRecoverySession === null ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Verifying recovery link…
            </div>
          ) : !hasRecoverySession ? (
            <div className="mt-6 space-y-4">
              <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                No active password recovery session found. Please request a new password reset link.
              </div>
              <div className="flex flex-col gap-2 text-center text-sm">
                <Link
                  to="/admin/forgot-password"
                  className="font-medium text-brand-blue hover:underline"
                >
                  Request Password Reset Link
                </Link>
                <Link to="/admin/login" className="text-muted-foreground hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                Your password has been updated successfully! You can now log in with your new password.
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate({ to: "/admin/login", replace: true })}
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  New Password
                </span>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Confirm New Password
                </span>
                <PasswordInput
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Updating Password…" : "Update Password"}
              </Button>

              <div className="mt-4 text-center text-sm">
                <Link to="/admin/login" className="font-medium text-brand-blue hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
