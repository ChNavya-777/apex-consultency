/**
 * Canonical Student Documents Domain Definitions & Validation Logic.
 */

export type DocumentCategory =
  | "passport"
  | "academic_transcript"
  | "degree_certificate"
  | "english_test"
  | "resume_cv"
  | "financial"
  | "offer_letter"
  | "visa"
  | "other";

export type DocumentStatus = "pending" | "uploaded";

export type CategoryDefinition = {
  key: DocumentCategory;
  label: string;
  description: string;
};

export const DOCUMENT_CATEGORIES: CategoryDefinition[] = [
  { key: "passport", label: "Passport / ID", description: "Passport identification pages or official ID." },
  { key: "academic_transcript", label: "Academic Transcript", description: "Marksheets, transcripts, and academic records." },
  { key: "degree_certificate", label: "Degree Certificate", description: "Graduation certificate or provisional degree." },
  { key: "english_test", label: "English Test Score", description: "IELTS, PTE, TOEFL, or Duolingo scorecard." },
  { key: "resume_cv", label: "Resume / CV", description: "Professional resume or curriculum vitae." },
  { key: "financial", label: "Financial / Funding", description: "Bank statements, loan letters, or financial affidavits." },
  { key: "offer_letter", label: "Offer Letter", description: "University offer letter (conditional/unconditional)." },
  { key: "visa", label: "Visa Document", description: "CAS, i20, visa application form, or visa copy." },
  { key: "other", label: "Other Document", description: "Miscellaneous supporting documentation." },
];

export const documentCategoryLabels: Record<DocumentCategory, string> = {
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
  // Strip path traversal attempts and backslashes
  const basename = raw.replace(/^.*[\\/]/, "");
  // Replace non-alphanumeric (except single dot, dash, underscore) with underscore
  const sanitized = basename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // Ensure non-empty and length <= 255
  return (sanitized.trim() || "document").slice(0, 255);
}

export function validateDocumentFile(
  filename: string,
  mimeType: string,
  fileSize: number,
): { valid: boolean; error?: string } {
  if (fileSize <= 0) {
    return { valid: false, error: "File is empty." };
  }
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File size exceeds the 10 MB limit." };
  }

  const cleanName = filename.trim().toLowerCase();
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

  const normalizedMime = mimeType.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime as any)) {
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
  status: DocumentStatus;
  uploadedByCounsellorId: string | null;
  uploadedByCounsellorName: string;
  createdAt: string;
  updatedAt: string;
};
