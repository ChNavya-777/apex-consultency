import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, KeyRound, LogOut, UserRound } from "lucide-react";
import {
  StudentCard,
  StudentHeading,
  StudentLayout,
  SupportCard,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { signOut } from "@/lib/portal-auth";

const title = "Settings — APEX Student Portal";
const description = "Manage your APEX Student Portal account preferences.";

export const Route = createFileRoute("/student/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentSettingsPage,
});

function StudentSettingsPage() {
  const session = useRequireStudent();
  const navigate = useNavigate();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="Settings" text="Your account and portal preferences." />

      <div className="space-y-5">
        <StudentCard title="Account Information" icon={UserRound}>
          <dl className="rounded-xl border border-border bg-surface/50 px-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-sm text-foreground">{session.email}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <dt className="text-sm text-muted-foreground">Account type</dt>
              <dd className="text-sm text-foreground">Student</dd>
            </div>
          </dl>
        </StudentCard>

        <StudentCard title="Password" icon={KeyRound}>
          <p className="text-sm text-muted-foreground">
            Password changes will be available once student sign-in is connected to the APEX account
            system. Until then, contact your counsellor to reset your password.
          </p>
        </StudentCard>

        <StudentCard title="Notifications" icon={Bell}>
          <p className="text-sm text-muted-foreground">
            You&apos;ll receive updates about your consultation and application progress in the
            portal. Email and SMS preferences will be available in a later phase.
          </p>
        </StudentCard>

        <SupportCard id="help" />

        <StudentCard title="Sign out" icon={LogOut}>
          <p className="text-sm text-muted-foreground">
            You can sign back in at any time with your student email.
          </p>
          <button
            type="button"
            onClick={() => {
              signOut();
              void navigate({ to: "/student/login", replace: true });
            }}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </StudentCard>
      </div>
    </StudentLayout>
  );
}
