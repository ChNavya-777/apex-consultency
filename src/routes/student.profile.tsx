import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import {
  EmptyState,
  ProfileCard,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
  type FieldGroup,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";

const title = "My Profile — APEX Student Portal";
const description = "Your personal, academic and study preference details in the APEX Student Portal.";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentProfilePage,
});

/** Field structure only — values arrive when the student data source is connected. */
const groups: FieldGroup[] = [
  { heading: "Personal Information", fields: ["Full Name", "Phone", "Email"] },
  {
    heading: "Academic Profile",
    fields: ["Current Degree", "Branch / Specialisation", "Graduation Year", "CGPA / Percentage"],
  },
  {
    heading: "Study Preferences",
    fields: [
      "Preferred Country",
      "Preferred Course",
      "Preferred Intake",
      "IELTS / PTE Status",
      "Budget Range",
    ],
  },
  { heading: "Additional Information", fields: ["Anything Else We Should Know"] },
];

function StudentProfilePage() {
  const session = useRequireStudent();
  if (!session) return null;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Profile" text="Your details as shared with APEX." />

      <div className="space-y-5">
        <EmptyState
          icon={UserRound}
          title="No profile information available yet."
          text="Profile information will appear here once your enquiry is connected."
        />

        <StudentCard title="Profile Details">
          <ProfileCard
            groups={groups}
            emptyText="These sections will fill in automatically once your enquiry information is connected."
          />
        </StudentCard>
      </div>
    </StudentLayout>
  );
}
