import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FolderOpen,
  FileCheck,
  Clock,
  AlertTriangle,
  UploadCloud,
  Loader2,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
  EmptyState,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import {
  useStudentPortalData,
  usePrepareDocumentUpload,
  useConfirmDocumentUpload,
  useGetDocumentPreviewUrl,
} from "@/lib/use-portal-data";
import {
  DocumentPreviewModal,
  type PreviewDocumentInfo,
} from "@/components/portal/DocumentPreviewModal";
import {
  validateDocumentFile,
  DOCUMENT_CENTER_GROUPS,
  documentTypeLabels,
  formatFileSize,
  type StudentDocument,
  type DocumentStatus,
} from "@/lib/student-documents";
import { findStudent } from "@/lib/portal-data";

const title = "Document Center — APEX Student Portal";
const description = "Upload and manage your study abroad application documents securely.";

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

const STATUS_PRIORITY: Record<string, number> = {
  verified: 4,
  awaiting_verification: 3,
  uploaded: 3,
  rejected: 2,
  pending: 1,
  not_uploaded: 0,
};

function StudentDocumentsPage() {
  const session = useRequireStudent();
  const { data, isLoading, refetch } = useStudentPortalData(session?.email);

  const prepareUploadMutation = usePrepareDocumentUpload();
  const confirmUploadMutation = useConfirmDocumentUpload();

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Document Preview Modal states
  const getPreviewUrlMutation = useGetDocumentPreviewUrl();
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocumentInfo | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ previewUrl: string | null; downloadUrl: string | null }>({
    previewUrl: null,
    downloadUrl: null,
  });
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  if (!session) return null;

  const profile = findStudent(data.students, session.email);
  const studentId = profile?.id || session.email;
  const documents: StudentDocument[] = data.documents || [];

  // Guarantee newest document first by created_at DESC
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  // Map newest uploaded document per docType slot (newest active document wins)
  const docMap = new Map<string, StudentDocument>();

  // Pass 1: exact docType matches (newest wins)
  for (const doc of sortedDocuments) {
    if (doc.docType && doc.docType !== "other") {
      if (!docMap.has(doc.docType)) {
        docMap.set(doc.docType, doc);
      }
    }
  }

  // Pass 2: category / legacy alias matches for unmapped slots
  for (const doc of sortedDocuments) {
    const keys: string[] = [];
    if (doc.category) {
      keys.push(doc.category);
      if (doc.category === "academic_transcript") keys.push("bachelor_transcript");
      if (doc.category === "degree_certificate") keys.push("bachelor_degree");
      if (doc.category === "english_test") keys.push("ielts_pte");
      if (doc.category === "resume_cv") keys.push("cv");
      if (doc.category === "financial") keys.push("bank_statement");
      if (doc.category === "visa") keys.push("visa_passport");
    }
    if (doc.docType === "other" && keys.length === 0) {
      keys.push("other");
    }

    for (const key of keys) {
      if (!docMap.has(key)) {
        docMap.set(key, doc);
      }
    }
  }

  async function handleFileUpload(groupKey: string, typeKey: string, file: File) {
    setFeedback(null);

    // 1. Client-side file validation for instant feedback
    const valResult = validateDocumentFile(file.name, file.type, file.size, typeKey);
    if (!valResult.valid) {
      setFeedback({
        type: "error",
        message: valResult.error || "Invalid file format or size.",
      });
      return;
    }

    setUploadingType(typeKey);

    const existingDoc = docMap.get(typeKey);
    const isReplacing = !!existingDoc && existingDoc.status !== "not_uploaded";

    try {
      // 2. Prepare signed upload URL
      const prepRes = await prepareUploadMutation.mutateAsync({
        studentId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category: groupKey,
        docType: typeKey,
      });

      // 3. Upload file directly to Supabase Storage signed URL
      const uploadRes = await fetch(prepRes.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload storage request failed (${uploadRes.statusText}).`);
      }

      // 4. Confirm upload metadata record status
      await confirmUploadMutation.mutateAsync({
        studentId,
        documentId: prepRes.documentId,
      });

      setFeedback({
        type: "success",
        message: `${documentTypeLabels[typeKey] || "Document"} ${
          isReplacing ? "replaced" : "uploaded"
        } successfully! Awaiting counsellor verification.`,
      });
      await refetch();
    } catch (err) {
      console.error("Document upload error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to upload document. Please try again.",
      });
    } finally {
      setUploadingType(null);
    }
  }

  async function handleViewDocument(doc: StudentDocument) {
    setViewingDocId(doc.id);
    setPreviewError(null);
    setPreviewUrls({ previewUrl: null, downloadUrl: null });
    setPreviewDoc({
      id: doc.id,
      originalFilename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType ?? null,
      docType: doc.docType ?? null,
      status: doc.status,
      rejectionReason: doc.rejectionReason ?? null,
    });
    setPreviewModalOpen(true);
    setIsPreviewLoading(true);

    try {
      const res = await getPreviewUrlMutation.mutateAsync({
        studentId,
        documentId: doc.id,
      });
      setPreviewUrls({
        previewUrl: res.previewUrl ?? null,
        downloadUrl: res.downloadUrl ?? null,
      });
      // Patch in any extra metadata returned from server
      setPreviewDoc((prev) =>
        prev
          ? {
              ...prev,
              mimeType: res.mimeType ?? prev.mimeType ?? null,
              fileSize: res.fileSize || prev.fileSize,
              status: res.status || prev.status,
              rejectionReason:
                res.rejectionReason ?? prev.rejectionReason ?? null,
            }
          : prev
      );
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Failed to generate preview.");
    } finally {
      setIsPreviewLoading(false);
      setViewingDocId(null);
    }
  }

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading
        title="Document Center"
        text="Upload, track, and verify your study abroad application and visa documents."
      />

      <div className="space-y-6">
        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {feedback.type === "error" && <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {DOCUMENT_CENTER_GROUPS.map((group) => (
          <StudentCard key={group.groupKey} title={group.title}>
            <p className="text-xs text-muted-foreground -mt-2 mb-4">{group.description}</p>

            <div className="divide-y divide-border/60">
              {group.items.map((item) => {
                const doc = docMap.get(item.typeKey);
                const status: DocumentStatus = doc ? doc.status : "not_uploaded";
                const isUploading = uploadingType === item.typeKey;

                return (
                  <div
                    key={item.typeKey}
                    className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {item.label}
                        </span>
                        {item.required && (
                          <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>

                      {doc && (
                        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span>File: <strong className="text-foreground">{doc.originalFilename}</strong></span>
                          <span>({formatFileSize(doc.fileSize)})</span>
                        </div>
                      )}

                      {/* Rejection Reason Box */}
                      {status === "rejected" && doc?.rejectionReason && (
                        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                          <p className="font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Rejection Reason:
                          </p>
                          <p className="mt-0.5">{doc.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                      {/* View button — opens inline preview modal */}
                      {doc && (
                        <button
                          type="button"
                          onClick={() => handleViewDocument(doc)}
                          disabled={viewingDocId === doc.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {viewingDocId === doc.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          View
                        </button>
                      )}

                      {/* Not Uploaded: Show standard Upload Document button */}
                      {status === "not_uploaded" && (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" />
                              Upload Document
                            </>
                          )}
                          <input
                            type="file"
                            disabled={isUploading}
                            className="hidden"
                            accept={item.typeKey === "passport_photo" ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(group.groupKey, item.typeKey, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}

                      {/* Awaiting Verification: Show [ Replace File ] and [ 🔒 Awaiting Review ] */}
                      {(status === "awaiting_verification" || status === "pending" || status === "uploaded") && (
                        <>
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                            {isUploading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Replacing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                Replace File
                              </>
                            )}
                            <input
                              type="file"
                              disabled={isUploading}
                              className="hidden"
                              accept={item.typeKey === "passport_photo" ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(group.groupKey, item.typeKey, file);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <div className="flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium px-2.5 py-1 bg-amber-500/10 rounded-md border border-amber-500/20">
                              <Lock className="h-3.5 w-3.5" />
                              Awaiting Review
                            </span>
                            <span className="text-[10px] text-muted-foreground">Waiting for counsellor verification.</span>
                          </div>
                        </>
                      )}

                      {/* Rejected: Show [ Re-upload File ] */}
                      {status === "rejected" && (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" />
                              Re-upload File
                            </>
                          )}
                          <input
                            type="file"
                            disabled={isUploading}
                            className="hidden"
                            accept={item.typeKey === "passport_photo" ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(group.groupKey, item.typeKey, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}

                      {/* Verified: Show [ ✓ Verified ] badge */}
                      {status === "verified" && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </StudentCard>
        ))}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewDoc(null);
          setPreviewUrls({ previewUrl: null, downloadUrl: null });
          setPreviewError(null);
        }}
        doc={previewDoc}
        previewUrl={previewUrls.previewUrl}
        downloadUrl={previewUrls.downloadUrl}
        isLoading={isPreviewLoading}
        error={previewError}
      />
    </StudentLayout>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
          <FileCheck className="h-3 w-3" /> Verified
        </span>
      );
    case "awaiting_verification":
    case "pending":
    case "uploaded":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" /> Awaiting Verification
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive border border-destructive/20">
          <AlertTriangle className="h-3 w-3" /> Action Required (Rejected)
        </span>
      );
    case "not_uploaded":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
          Not Uploaded
        </span>
      );
  }
}
