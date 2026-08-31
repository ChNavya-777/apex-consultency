import { createFileRoute } from "@tanstack/react-router";
import {
  EmptyState,
  PortalCard,
  PortalHeading,
  PortalLayout,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";

const title = "Students — APEX Global Education Portal";
const description = "Student enquiries received through the APEX consultation form.";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminStudentsPage,
});

const columns = [
  "Full Name",
  "Email",
  "Phone",
  "Preferred Country",
  "Preferred Intake",
  "Submitted At",
];

function AdminStudentsPage() {
  const session = useRequireRole("super_admin");
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading title="Students" text="Student enquiries from the consultation form." />

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
                    No student enquiries yet
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Student enquiries will appear here once the consultation Google Sheet data
                    source is connected.
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
          text="Student information will be read from the consultation Google Sheet in the next phase."
        />
      </div>
    </PortalLayout>
  );
}
