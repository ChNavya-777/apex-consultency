import { createFileRoute } from "@tanstack/react-router";
import { PortalCard, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";

const title = "My Students — APEX Global Education Portal";
const description = "Students associated with your consultation sessions.";

export const Route = createFileRoute("/counsellor/students")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorStudentsPage,
});

const columns = [
  "Full Name",
  "Email",
  "Phone",
  "Current Degree",
  "Preferred Country",
  "Preferred Course",
  "Preferred Intake",
];

function CounsellorStudentsPage() {
  const session = useRequireRole("counsellor");
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title="My Students" text="Students linked to your consultation sessions." />

      <PortalCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <p className="font-display text-base font-semibold text-foreground">
                    No students assigned yet
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Students associated with your consultation sessions will appear here.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PortalCard>
    </PortalLayout>
  );
}
