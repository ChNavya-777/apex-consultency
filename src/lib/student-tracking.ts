/**
 * Canonical Student Tracking & Counsellor Notes Domain Definitions.
 *
 * Defines the seven business stages of the APEX Global Education student journey and shared domain types.
 */

export type TrackingStage =
  | "consultation"
  | "profile_evaluation"
  | "university_shortlisting"
  | "application"
  | "offer"
  | "visa"
  | "pre_departure";

export type StageDefinition = {
  key: TrackingStage;
  label: string;
  description: string;
};

export const TRACKING_STAGES: StageDefinition[] = [
  {
    key: "consultation",
    label: "Consultation",
    description: "Initial consultation meeting and enquiry mapping.",
  },
  {
    key: "profile_evaluation",
    label: "Profile Evaluation",
    description: "Review of academic credentials, test scores, and profile fit.",
  },
  {
    key: "university_shortlisting",
    label: "University Shortlisting",
    description: "Selecting target universities, courses, and intake options.",
  },
  {
    key: "application",
    label: "Application",
    description: "Preparing documents and submitting applications to universities.",
  },
  {
    key: "offer",
    label: "Offer",
    description: "Receiving conditional/unconditional offers and selecting university.",
  },
  {
    key: "visa",
    label: "Visa",
    description: "Financial documentation, CAS/i20 processing, and visa filing.",
  },
  {
    key: "pre_departure",
    label: "Pre-Departure",
    description: "Accommodation, forex, flight booking, and orientation.",
  },
];

export const trackingStageLabels: Record<TrackingStage, string> = {
  consultation: "Consultation",
  profile_evaluation: "Profile Evaluation",
  university_shortlisting: "University Shortlisting",
  application: "Application",
  offer: "Offer",
  visa: "Visa",
  pre_departure: "Pre-Departure",
};

export function getStageIndex(stage: string): number {
  const index = TRACKING_STAGES.findIndex((s) => s.key === stage);
  return index >= 0 ? index : 0;
}

export function isValidStage(stage: string): stage is TrackingStage {
  return TRACKING_STAGES.some((s) => s.key === stage);
}

export type StudentTrackingState = {
  id?: string;
  studentId: string;
  currentStage: TrackingStage;
  updatedByCounsellorId: string | null;
  updatedByCounsellorName: string | null;
  stageNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrackingHistoryItem = {
  id: string;
  studentId: string;
  stage: TrackingStage;
  previousStage: TrackingStage | null;
  changedByCounsellorId: string | null;
  changedByCounsellorName: string | null;
  notes: string | null;
  createdAt: string;
};

export type NoteCategory = "general" | "academic" | "visa" | "financial";

export const NOTE_CATEGORIES: { key: NoteCategory; label: string }[] = [
  { key: "general", label: "General" },
  { key: "academic", label: "Academic" },
  { key: "visa", label: "Visa / Immigration" },
  { key: "financial", label: "Financial / Funding" },
];

export const noteCategoryLabels: Record<NoteCategory, string> = {
  general: "General",
  academic: "Academic",
  visa: "Visa / Immigration",
  financial: "Financial / Funding",
};

export type CounsellorStudentNote = {
  id: string;
  studentId: string;
  counsellorId: string | null;
  counsellorName: string;
  counsellorEmail: string;
  noteText: string;
  category: NoteCategory;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};
