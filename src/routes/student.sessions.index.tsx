import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  SessionEmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { cn } from "@/lib/utils";

const title = "My Sessions — APEX Student Portal";
const description = "Your upcoming and completed APEX consultation sessions.";

export const Route = createFileRoute("/student/sessions/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentSessionsPage,
});

const tabs = ["Upcoming", "Completed"] as const;

function StudentSessionsPage() {
  const session = useRequireStudent();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Upcoming");
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Sessions" text="Your consultations with your APEX counsellor." />

      <StudentCard>
        <div
          role="tablist"
          aria-label="Session status"
          className="mb-5 inline-flex rounded-xl bg-surface p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "min-w-[7rem] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <SessionEmptyState
          title={tab === "Upcoming" ? "No upcoming sessions" : "No completed sessions"}
          text="Your consultation sessions will appear here once your bookings are connected."
        />
      </StudentCard>
    </StudentLayout>
  );
}
