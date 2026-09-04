import { createFileRoute } from "@tanstack/react-router";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import { StudentTable } from "@/components/portal/StudentTable";
import { useAdminPortalData } from "@/lib/use-portal-data";

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

function AdminStudentsPage() {
  const session = useRequireRole("super_admin");
  /** Super Admin scope: every student linked to a booking, across all counsellors. */
  const { data, isLoading } = useAdminPortalData();
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading title="Students" text="Student enquiries from the consultation form." />

      <StudentTable
        students={data.students}
        note={data.studentSourceError}
        emptyTitle={isLoading ? "Loading students…" : "No student records yet"}
        emptyText="Students linked to consultation bookings will appear here."
      />
    </PortalLayout>
  );
}

