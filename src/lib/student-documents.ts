/**
 * Canonical Student Documents Domain Definitions & Validation Logic.
 * Updated for Phase 1 — Document Center Workflow.
 */

export type DocumentCategory =
  | "application_documents"
  | "financial_documents"
  | "visa_documents"
  | "pre_departure"
  | "passport"
  | "academic_transcript"
  | "degree_certificate"
  | "english_test"
  | "resume_cv"
  | "financial"
  | "offer_letter"
  | "visa"
  | "other";

export type DocumentStatus =
  | "not_uploaded"
  | "awaiting_verification"
  | "verified"
  | "rejected"
  | "pending"
  | "uploaded";

export type BusinessDocumentItem = {
  typeKey: string;
  label: string;
  description: string;
  required: boolean;
};

export type BusinessDocumentGroup = {
  groupKey: DocumentCategory;
  title: string;
  description: string;
  items: BusinessDocumentItem[];
};

export const DOCUMENT_CENTER_GROUPS: BusinessDocumentGroup[] = [
  {
    groupKey: "application_documents",
    title: "Application Documents",
    description: "Core academic, personal, and application reference documents required for university submission.",
    items: [
      { typeKey: "passport", label: "Passport", description: "Clear copy of passport ID & address pages.", required: true },
      { typeKey: "passport_photo", label: "Passport-size Photo", description: "Recent passport-size photograph (JPG, JPEG, PNG — Max 5 MB).", required: true },
      { typeKey: "bachelor_transcript", label: "Bachelor's Transcript", description: "Semester marksheets or consolidated transcript.", required: true },
      { typeKey: "bachelor_degree", label: "Bachelor's Degree", description: "Degree certificate or provisional certificate.", required: true },
      { typeKey: "ielts_pte", label: "IELTS / PTE / Test Score", description: "Official English proficiency scorecard.", required: false },
      { typeKey: "cv", label: "CV / Resume", description: "Updated professional resume.", required: true },
      { typeKey: "sop", label: "Statement of Purpose (SOP)", description: "Personal essay explaining academic goals.", required: true },
      { typeKey: "lor_1", label: "Letter of Recommendation 1 (LOR 1)", description: "Academic or professional recommendation.", required: true },
      { typeKey: "lor_2", label: "Letter of Recommendation 2 (LOR 2)", description: "Second recommendation letter.", required: false },
    ],
  },
  {
    groupKey: "financial_documents",
    title: "Financial Documents",
    description: "Proof of funds, bank statements, and loan sanction letters for university and visa clearance.",
    items: [
      { typeKey: "bank_statement", label: "Bank Statement", description: "Recent 6-month bank statement with sufficient liquid funds.", required: true },
      { typeKey: "education_loan_letter", label: "Education Loan Letter", description: "Official loan sanction letter from bank/financial institution.", required: false },
    ],
  },
  {
    groupKey: "visa_documents",
    title: "Visa Documents",
    description: "Official documentation required for student visa lodging.",
    items: [
      { typeKey: "visa_passport", label: "Passport (Visa Copy)", description: "Valid passport for visa endorsement.", required: true },
      { typeKey: "offer_letter", label: "Offer Letter / CAS / i20", description: "Unconditional offer letter or CAS / i20 document.", required: true },
      { typeKey: "financial_evidence", label: "Financial Evidence", description: "Affidavit of support, tax returns, or bank guarantee.", required: true },
      { typeKey: "visa_application", label: "Visa Application Form", description: "Completed visa form or fee payment receipt.", required: true },
    ],
  },
  {
    groupKey: "pre_departure",
    title: "Pre-Departure",
    description: "Travel arrangements, student accommodation, and health insurance documentation.",
    items: [
      { typeKey: "accommodation", label: "Accommodation Booking", description: "University hall or private student housing confirmation.", required: false },
      { typeKey: "insurance", label: "Health / Travel Insurance", description: "Overseas student health cover (OSHC/TB test/Insurance).", required: false },
      { typeKey: "flight_details", label: "Flight Details", description: "Flight itinerary and arrival confirmation.", required: false },
    ],
  },
];

export const DOCUMENT_CATEGORIES: { key: DocumentCategory; label: string; description: string }[] = [
  { key: "application_documents", label: "Application Documents", description: "Academic transcripts, degree certificates, test scores, etc." },
  { key: "financial_documents", label: "Financial Documents", description: "Bank statements, loan sanction letters, etc." },
  { key: "visa_documents", label: "Visa Documents", description: "Visa application files, CAS/I-20, financial evidence." },
  { key: "pre_departure", label: "Pre-Departure", description: "Flight, insurance, accommodation confirmations." },
  { key: "other", label: "Other Document", description: "Miscellaneous supporting documentation." },
];

export const documentCategoryLabels: Record<string, string> = {
  application_documents: "Application Documents",
  financial_documents: "Financial Documents",
  visa_documents: "Visa Documents",
  pre_departure: "Pre-Departure",
  passport: "Passport / ID",
  academic_transcript: "Academic Transcript",
  degree_certificate: "Degree Certificate",
  english_test: "English Test Score",
  resume_cv: "Resume / CV",
  financial: "Financial / Funding",
  offer_letter: "Offer Letter",
  visa: "Visa Document",
  other: "Other Document",
};

export const documentTypeLabels: Record<string, string> = {
  passport: "Passport",
  passport_photo: "Passport-size Photo",
  bachelor_transcript: "Bachelor's Transcript",
  bachelor_degree: "Bachelor's Degree",
  ielts_pte: "IELTS / PTE Scorecard",
  cv: "CV / Resume",
  sop: "Statement of Purpose (SOP)",
  lor_1: "Letter of Recommendation 1 (LOR 1)",
  lor_2: "Letter of Recommendation 2 (LOR 2)",
  bank_statement: "Bank Statement",
  education_loan_letter: "Education Loan Letter",
  visa_passport: "Passport (Visa Copy)",
  offer_letter: "Offer Letter / CAS / i20",
  financial_evidence: "Financial Evidence",
  visa_application: "Visa Application Form",
  accommodation: "Accommodation Booking",
  insurance: "Health / Travel Insurance",
  flight_details: "Flight Details",
  other: "Other Document",
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"] as const;

export const FORBIDDEN_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".js", ".ts", ".html", ".htm", ".svg", ".php", ".py", ".ps1", ".vbs"
] as const;

export function sanitizeFilename(raw: string): string {
  if (!raw) return "document";
  const basename = raw.replace(/^.*[\\/]/, "");
  const sanitized = basename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return (sanitized.trim() || "document").slice(0, 255);
}

export function validateDocumentFile(
  filename: string,
  mimeType: string,
  fileSize: number,
  docType?: string | null
): { valid: boolean; error?: string } {
  if (fileSize <= 0) {
    return { valid: false, error: "File is empty." };
  }

  const cleanName = filename.trim().toLowerCase();
  const normalizedMime = mimeType.trim().toLowerCase();

  if (docType === "passport_photo") {
    if (fileSize > 5 * 1024 * 1024) {
      return { valid: false, error: "Passport photo file size exceeds the 5 MB limit." };
    }
    const isImageExt = [".jpg", ".jpeg", ".png"].some((ext) => cleanName.endsWith(ext));
    if (!isImageExt) {
      return { valid: false, error: "Passport photo must be in JPG, JPEG, or PNG format." };
    }
    if (normalizedMime && !["image/jpeg", "image/png", "image/jpg"].includes(normalizedMime)) {
      return { valid: false, error: "Passport photo must be a valid image file (JPG, PNG)." };
    }
  } else {
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: "File size exceeds the 10 MB limit." };
    }
  }

  const hasForbiddenExt = FORBIDDEN_EXTENSIONS.some((ext) => cleanName.endsWith(ext));
  if (hasForbiddenExt) {
    return { valid: false, error: "Executable and script file types are strictly prohibited." };
  }

  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => cleanName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      valid: false,
      error: `Unsupported file extension. Allowed formats: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  if (normalizedMime && !ALLOWED_MIME_TYPES.includes(normalizedMime as any)) {
    return {
      valid: false,
      error: `Unsupported MIME type '${mimeType}'. Allowed types: PDF, JPG, PNG, DOC, DOCX.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type StudentDocument = {
  id: string;
  studentId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  docType?: string | null;
  status: DocumentStatus;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  verifiedByCounsellorId?: string | null;
  verifiedByCounsellorName?: string | null;
  uploadedByCounsellorId: string | null;
  uploadedByCounsellorName: string;
  createdAt: string;
  updatedAt: string;
};
