/**
 * Student table shared by the counsellor and Super Admin portals.
 *
 * Values come straight from the Student Sheet. When no Student Sheet row exists for a booking's
 * email, the row is still shown with the booking's own details and the missing profile fields
 * are marked unavailable — nothing is invented.
 */

import { Fragment, useState } from "react";
import { PortalCard } from "@/components/portal/PortalShell";
import type { StudentProfile } from "@/lib/portal-data";

const columns = [
  "Full Name",
  "Email",
  "Phone",
  "Current Degree",
  "Preferred Country",
  "Preferred Course",
  "Preferred Intake",
  "",
];

function Cell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground/60">—</span>;
  return <>{value}</>;
}

/** The remaining Student Sheet fields, shown when a row is expanded. */
function StudentDetails({ student }: { student: StudentProfile }) {
  const fields: [string, string | null][] = [
    ["Branch / Specialisation", student.branch],
    ["Graduation Year", student.graduationYear],
    ["CGPA / Percentage", student.cgpa],
    ["IELTS / PTE Status", student.englishTest],
    ["Budget Range", student.budget],
    ["Submitted At", student.submittedAt],
    ["Anything Else We Should Know", student.additionalInfo],
  ];
  return (
    <div className="grid gap-4 bg-surface px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-sm text-foreground">
            <Cell value={value} />
          </p>
        </div>
      ))}
    </div>
  );
}


export function StudentTable({
  students,
  note,
  emptyTitle = "No students assigned yet",
  emptyText = "Students associated with your consultation sessions will appear here.",
}: {
  students: StudentProfile[];
  note?: string | null;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  return (
    <PortalCard className="p-0">
      {note && (
        <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">{note}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c || `col-${i}`}
                  className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <p className="font-display text-base font-semibold text-foreground">
                    {emptyTitle}
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{emptyText}</p>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const open = openEmail === student.email;
                return (
                  <Fragment key={student.email}>
                    <tr className="border-b border-border">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                        <Cell value={student.fullName} />
                        {!student.found && (
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Profile unavailable
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Cell value={student.phone} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Cell value={student.currentDegree} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Cell value={student.preferredCountry} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Cell value={student.preferredCourse} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Cell value={student.preferredIntake} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        {student.found && (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenEmail(open ? null : student.email)}
                            className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
                          >
                            {open ? "Hide details" : "More details"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-border">
                        <td colSpan={columns.length} className="p-0">
                          <StudentDetails student={student} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PortalCard>

  );
}
