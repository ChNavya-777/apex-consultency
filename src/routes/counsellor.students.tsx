import { createFileRoute } from "@tanstack/react-router";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { StudentTable } from "@/components/portal/StudentTable";
import { useCounsellorPortalData } from "@/lib/use-portal-data";

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

function CounsellorStudentsPage() {
  const session = useRequireRole("counsellor");
  /**
   * Students are derived on the server from this counsellor's own bookings only:
   * counsellor login email → Booking Sheet `counsellor_email` → `student_email` → Student Sheet.
   */
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title="My Students" text="Students linked to your consultation sessions." />

      <StudentTable
        students={data.students}
        note={data.studentSourceError}
        emptyTitle={isLoading ? "Loading your students…" : "No students assigned yet"}
      />
    </PortalLayout>
  );
}
