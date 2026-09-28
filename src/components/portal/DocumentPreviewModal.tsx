import {
  FileText,
  Download,
  Loader2,
  FileCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/student-documents";

export interface PreviewDocumentInfo {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType?: string | null;
  docType?: string | null;
  status: string;
  rejectionReason?: string | null;
}

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: PreviewDocumentInfo | null;
  /** URL to render inline inside the modal (no Content-Disposition: attachment) */
  previewUrl: string | null;
  /** URL that triggers a forced download (Content-Disposition: attachment) */
  downloadUrl: string | null;
  isLoading?: boolean;
  error?: string | null;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  doc,
  previewUrl,
  downloadUrl,
  isLoading = false,
  error = null,
}: DocumentPreviewModalProps) {
  if (!isOpen || !doc) return null;

  const filename = doc.originalFilename;
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mime = (doc.mimeType || "").toLowerCase();

  const isPdf = mime === "application/pdf" || ext === "pdf";
  const isImage =
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);

  // Download link falls back to preview URL if a separate download URL is not available
  const effectiveDownloadUrl = downloadUrl || previewUrl;

  function handleDownload() {
    if (!effectiveDownloadUrl) return;
    const a = window.document.createElement("a");
    a.href = effectiveDownloadUrl;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-6 gap-4">
        <DialogHeader className="border-b border-border pb-3 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="font-display text-base font-bold text-foreground truncate max-w-sm">
              {filename}
            </DialogTitle>
            <DocStatusBadge status={doc.status} />
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Size: {formatFileSize(doc.fileSize)} &bull; Type: {ext.toUpperCase() || "File"}
          </DialogDescription>
        </DialogHeader>

        {/* Rejection notice inside modal if rejected */}
        {doc.status === "rejected" && doc.rejectionReason && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Rejection Reason:</strong> {doc.rejectionReason}
            </div>
          </div>
        )}

        {/* Preview Content Area */}
        <div className="flex-1 min-h-[320px] max-h-[58vh] overflow-auto flex items-center justify-center bg-surface/50 rounded-xl border border-border p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
              <p className="text-sm font-medium">Generating secure preview…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-destructive text-center">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm font-semibold">Failed to load preview</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : previewUrl ? (
            isPdf ? (
              <iframe
                src={previewUrl}
                title={filename}
                className="w-full h-[54vh] rounded-lg border-0 bg-white"
              />
            ) : isImage ? (
              <div className="max-h-[54vh] overflow-auto flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt={filename}
                  className="max-h-[52vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
            ) : (
              /* Unsupported inline preview — show fallback card */
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm">
                <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm">{filename}</p>
                  <p className="text-xs text-muted-foreground">
                    Inline browser preview is not supported for{" "}
                    <strong>.{ext.toUpperCase()}</strong> files. Download the file below to
                    inspect it locally.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="text-xs text-muted-foreground">No preview available.</div>
          )}
        </div>

        {/* Modal Footer — explicit Download button, no auto-download from View */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground hidden sm:block">
            🔒 Private encrypted storage preview
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {effectiveDownloadUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                className="bg-brand-blue text-white hover:bg-brand-blue/90"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download File
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
          <FileCheck className="h-3 w-3" /> Verified
        </span>
      );
    case "awaiting_verification":
    case "pending":
    case "uploaded":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
          <Clock className="h-3 w-3" /> Awaiting Verification
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/20">
          <AlertTriangle className="h-3 w-3" /> Rejected
        </span>
      );
    default:
      return null;
  }
}
