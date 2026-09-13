import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap } from "lucide-react";

const title = "Reset Password — APEX Global Education Portal";
const description = "Request a password reset link for your APEX portal account.";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminForgotPasswordPage,
});

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (sbError) {
        console.error("Password reset request error:", sbError.message);
      }
      // Always show generic success message to prevent email enumeration
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset exception:", err);
      setSubmitted(true);
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
            Reset Your Password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your account email address and we'll send you a password reset link.
          </p>

          {submitted ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/10 p-4 text-sm text-brand-blue">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. Please check your inbox and follow the instructions.
              </div>
              <Link
                to="/admin/login"
                className="block text-center text-sm font-medium text-brand-blue hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Email Address
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apex.com"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Sending Link…" : "Send Reset Link"}
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
