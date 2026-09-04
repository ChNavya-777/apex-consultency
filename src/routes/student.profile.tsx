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
import { useStudentPortalData } from "@/lib/use-portal-data";
import { findStudent } from "@/lib/portal-data";

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
  /** Server-side: only the signed-in student's own Student Sheet row is returned. */
  const { data, isLoading } = useStudentPortalData(session?.email);
  if (!session) return null;

  const profile = findStudent(data.students, session.email);
  const found = !!profile?.found;

  /** Values come straight from the Student Sheet — nothing is guessed. */
  const values: Record<string, string | null | undefined> | undefined = found
    ? {
        "Full Name": profile?.fullName,
        Phone: profile?.phone,
        Email: profile?.email ?? session.email,
        "Current Degree": profile?.currentDegree,
        "Branch / Specialisation": profile?.branch,
        "Graduation Year": profile?.graduationYear,
        "CGPA / Percentage": profile?.cgpa,
        "Preferred Country": profile?.preferredCountry,
        "Preferred Course": profile?.preferredCourse,
        "Preferred Intake": profile?.preferredIntake,
        "IELTS / PTE Status": profile?.englishTest,
        "Budget Range": profile?.budget,
        "Anything Else We Should Know": profile?.additionalInfo,
      }
    : undefined;

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading title="My Profile" text="Your details as shared with APEX." />

      <div className="space-y-5">
        {!found && (
          <EmptyState
            icon={UserRound}
            title={isLoading ? "Loading your profile…" : "Profile unavailable"}
            text={
              isLoading
                ? "Fetching your consultation details."
                : (data.studentSourceError ??
                  "We couldn't find a consultation enquiry for this email address yet. Your details will appear here once you submit the consultation form.")
            }
          />
        )}

        <StudentCard title="Profile Details">
          <ProfileCard
            groups={groups}
            {...(values ? { values } : {})}
            {...(found
              ? {}
              : {
                  emptyText:
                    "These sections fill in automatically from your consultation enquiry.",
                })}
          />
        </StudentCard>

        {found && profile?.submittedAt && (
          <p className="text-xs text-muted-foreground">Submitted: {profile.submittedAt}</p>
        )}
      </div>
    </StudentLayout>
  );
}
