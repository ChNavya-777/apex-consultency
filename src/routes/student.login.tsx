import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInStudent } from "@/lib/portal-auth";
import { site } from "@/data/site";

const title = "Student Login — APEX Global Education Portal";
const description = "Sign in to the APEX Global Education Student Portal to view your study abroad journey.";

export const Route = createFileRoute("/student/login")({
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

function StudentLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

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
            Sign in to view your study abroad journey.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lift md:p-7">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const session = signInStudent(email.trim(), password);
              if (!session) {
                setError("Please check your email and password and try again.");
                return;
              }
              setError(null);
              void navigate({ to: "/student/dashboard", replace: true });
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>
      </div>
    </div>
  );
}
