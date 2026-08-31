import { createFileRoute } from "@tanstack/react-router";
import {
  EmptyState,
  PortalCard,
  PortalHeading,
  PortalLayout,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";

const title = "Sessions — APEX Global Education Portal";
const description = "Consultation sessions booked by students.";

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSessionsPage,
});

const columns = [
  "Booking UID",
  "Student Name",
  "Student Email",
  "Counsellor",
  "Start Time",
  "End Time",
  "Meeting URL",
];

function AdminSessionsPage() {
  const session = useRequireRole("super_admin");
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading title="Sessions" text="Consultation sessions booked by students." />

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
                    Sessions will appear here once the booking data source is connected.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PortalCard>

      <div className="mt-6">
        <EmptyState
          title="Data source not connected"
          text="Session records will be read from the booking Google Sheet in the next phase."
        />
      </div>
    </PortalLayout>
  );
}
