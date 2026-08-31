import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import {
  DocumentCard,
  EmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

const title = "My Documents — APEX Student Portal";
const description = "Documents shared with APEX Global Education for your study abroad application.";

export const Route = createFileRoute("/student/documents")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDocumentsPage,
});

const categories = [
  "Academic Documents",
  "Identity Documents",
  "English Language Test",
  "Application Documents",
  "Visa Documents",
];

function StudentDocumentsPage() {
  const session = useRequireStudent();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Documents" text="Everything you've shared with APEX, in one place." />

      <div className="space-y-5">
        <EmptyState
          icon={FolderOpen}
          title="No documents available"
          text="Documents shared with APEX will appear here."
        />

        <StudentCard title="Document categories">
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <DocumentCard key={category} category={category} />
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Secure document upload will be enabled in a later phase.
          </p>
        </StudentCard>
      </div>
    </StudentLayout>
  );
}
