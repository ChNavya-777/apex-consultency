/**
 * Client-safe shapes for portal data read from the external sheets.
 *
 * Student profile fields come from the Student Sheet; session fields come from the Booking
 * Sheet. Nothing here invents values: a field is `null` when the source has no value.
 */

import type { ConsultationSession } from "@/lib/sessions";

export type StudentProfile = {
  /** Optional UUID matching public.students.id */
  id?: string | null;
  /** Normalised email — the linking key between the two sheets. */
  email: string;
  fullName: string | null;
  phone: string | null;
  currentDegree: string | null;
  branch: string | null;
  graduationYear: string | null;
  cgpa: string | null;
  preferredCountry: string | null;
  preferredCourse: string | null;
  preferredIntake: string | null;
  englishTest: string | null;
  budget: string | null;
  additionalInfo: string | null;
  submittedAt: string | null;
  /** False when no Student Sheet row exists for this email. */
  found: boolean;
};

export type PortalData = {
  sessions: ConsultationSession[];
  students: StudentProfile[];
  /** Present when the Student Sheet could not be read (booking data still usable). */
  studentSourceError: string | null;
};

export function findStudent(students: StudentProfile[], email: string): StudentProfile | null {
  const normalized = email.trim().toLowerCase();
  return students.find((s) => s.email === normalized) ?? null;
}
