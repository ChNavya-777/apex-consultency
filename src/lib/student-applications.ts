/**
 * Canonical Student Shortlists, Applications & Offers Domain Definitions & Helpers.
 */

export type ShortlistCategory = "reach" | "target" | "safe";
export type ShortlistStatus = "considering" | "shortlisted" | "applying" | "archived";

export type ApplicationStatus =
  | "preparing"
  | "submitted"
  | "under_review"
  | "action_required"
  | "decision_received"
  | "withdrawn";

export type OfferType = "unconditional" | "conditional" | "rejected" | "waitlisted";
export type OfferDecisionStatus = "pending" | "accepted" | "declined" | "expired";

export type University = {
  id: string;
  name: string;
  country: string;
  city: string | null;
  websiteUrl: string | null;
  createdAt: string;
};

export type StudentShortlist = {
  id: string;
  studentId: string;
  universityId: string;
  universityName: string;
  universityCountry: string;
  universityCity: string | null;
  courseName: string;
  degreeLevel: string;
  intake: string;
  category: ShortlistCategory;
  status: ShortlistStatus;
  notes: string | null;
  createdByCounsellorId: string | null;
  updatedByCounsellorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentOffer = {
  id: string;
  applicationId: string;
  offerType: OfferType;
  conditions: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  depositDeadline: string | null;
  offerLetterDocumentId: string | null;
  offerLetterFilename?: string | null;
  decisionStatus: OfferDecisionStatus;
  decisionDate: string | null;
  createdByCounsellorId: string | null;
  updatedByCounsellorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentApplication = {
  id: string;
  studentId: string;
  shortlistId: string | null;
  universityId: string;
  universityName: string;
  universityCountry: string;
  universityCity: string | null;
  courseName: string;
  degreeLevel: string;
  intake: string;
  applicationNumber: string | null;
  status: ApplicationStatus;
  submissionDate: string | null;
  applicationDeadline: string | null;
  notes: string | null;
  offer: StudentOffer | null;
  createdByCounsellorId: string | null;
  updatedByCounsellorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const SHORTLIST_CATEGORIES: { key: ShortlistCategory; label: string; badgeClass: string }[] = [
  { key: "reach", label: "Reach", badgeClass: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "target", label: "Target", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "safe", label: "Safe", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
];

export const shortlistCategoryLabels: Record<ShortlistCategory, string> = {
  reach: "Reach",
  target: "Target",
  safe: "Safe",
};

export const shortlistStatusLabels: Record<ShortlistStatus, string> = {
  considering: "Considering",
  shortlisted: "Shortlisted",
  applying: "Applying",
  archived: "Archived",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  preparing: "Preparing",
  submitted: "Submitted",
  under_review: "Under Review",
  action_required: "Action Required",
  decision_received: "Decision Received",
  withdrawn: "Withdrawn",
};

export const offerTypeLabels: Record<OfferType, string> = {
  unconditional: "Unconditional Offer",
  conditional: "Conditional Offer",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

export const offerDecisionStatusLabels: Record<OfferDecisionStatus, string> = {
  pending: "Decision Pending",
  accepted: "Accepted (Firm)",
  declined: "Declined",
  expired: "Expired",
};

export function normalizeUniversityName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateShortlistInput(
  universityName: string,
  courseName: string,
  intake: string,
  degreeLevel: string,
): { valid: boolean; error?: string } {
  if (!universityName.trim()) {
    return { valid: false, error: "University name is required." };
  }
  if (!courseName.trim()) {
    return { valid: false, error: "Course / program name is required." };
  }
  if (!intake.trim()) {
    return { valid: false, error: "Intake (e.g. Fall 2027) is required." };
  }
  if (!degreeLevel.trim()) {
    return { valid: false, error: "Degree level is required." };
  }
  return { valid: true };
}

export function isDeadlineOverdue(deadline: string | null | undefined, status: ApplicationStatus): boolean {
  if (!deadline) return false;
  if (status === "submitted" || status === "under_review" || status === "decision_received" || status === "withdrawn") {
    return false;
  }
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

export function isDeadlineDueSoon(deadline: string | null | undefined, status: ApplicationStatus): boolean {
  if (!deadline) return false;
  if (isDeadlineOverdue(deadline, status)) return false;
  if (status === "submitted" || status === "under_review" || status === "decision_received" || status === "withdrawn") {
    return false;
  }
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return false;
  const in14Days = Date.now() + 14 * 24 * 60 * 60 * 1000;
  return t <= in14Days;
}
