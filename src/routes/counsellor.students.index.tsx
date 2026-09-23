import { createFileRoute } from "@tanstack/react-router";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { StudentDirectory } from "@/components/portal/StudentDirectory";
import { useCounsellorPortalData } from "@/lib/use-portal-data";

const title = "My Students — APEX Global Education Portal";
const description = "Students associated with your consultation sessions.";

export const Route = createFileRoute("/counsellor/students/")({
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
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
        <PortalHeading
          title="My Students"
          text="Students linked to your consultation sessions."
        />
        {data.students.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue self-start sm:self-auto">
            {data.students.length} Total Students
          </span>
        )}
      </div>

      <StudentDirectory
        students={data.students}
        sessions={data.sessions}
        note={data.studentSourceError}
        isLoading={isLoading}
      />
    </PortalLayout>
  );
}
