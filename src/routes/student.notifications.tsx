import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  EmptyState,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

const title = "Notifications — APEX Student Portal";
const description = "Updates about your consultation and study abroad journey.";

export const Route = createFileRoute("/student/notifications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentNotificationsPage,
});

function StudentNotificationsPage() {
  const session = useRequireStudent();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="Notifications" />

      <EmptyState
        icon={Bell}
        title="You're all caught up."
        text="Important updates about your consultation and study abroad journey will appear here."
      />
    </StudentLayout>
  );
}
