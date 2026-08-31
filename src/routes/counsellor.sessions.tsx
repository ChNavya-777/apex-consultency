import { createFileRoute } from "@tanstack/react-router";
import { PortalCard, PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";

const title = "My Sessions — APEX Global Education Portal";
const description = "Consultation sessions assigned to you.";

export const Route = createFileRoute("/counsellor/sessions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorSessionsPage,
});

const columns = ["Booking UID", "Student Name", "Student Email", "Start Time", "End Time", "Meeting URL"];

function CounsellorSessionsPage() {
  const session = useRequireRole("counsellor");
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title="My Sessions" text="Sessions assigned to you." />

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
                    No consultation sessions yet
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Your assigned sessions will appear here once the DayOtter session data is
                    connected.
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
