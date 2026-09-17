import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateSessionOutcome } from "@/lib/portal-data.functions";
import { sessionDateLabel, sessionTimeLabel, type ConsultationSession, type CounsellorOutcome } from "@/lib/sessions";

type SessionOutcomeModalProps = {
  session: ConsultationSession;
  targetOutcome: CounsellorOutcome | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function SessionOutcomeModal({
  session,
  targetOutcome,
  isOpen,
  onClose,
  onSuccess,
}: SessionOutcomeModalProps) {
  const [notes, setNotes] = useState(session.counsellorNotes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const mutateOutcome = useServerFn(updateSessionOutcome);

  if (!targetOutcome) return null;

  const isCompleted = targetOutcome === "completed";
  const title = isCompleted ? "Mark Session as Completed" : "Mark Session as Missed";
  const actionLabel = isCompleted ? "Mark Completed" : "Mark Missed";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const trimmedNotes = notes.trim();
    if (trimmedNotes.length > 2000) {
      setErrorMsg("Notes exceed the maximum length of 2000 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      await mutateOutcome({
        data: {
          bookingUid: session.bookingUid,
          outcome: targetOutcome,
          notes: trimmedNotes || null,
        },
      });

      // Refetch portal queries so UI immediately updates
      await queryClient.invalidateQueries({ queryKey: ["portal"] });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Outcome submission error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      // Clean up server error prefix if present
      const clean = raw.replace(/^Error:\s*/i, "").replace(/^\d{3}\s+[^:]+:\s*/i, "");
      setErrorMsg(clean || "Unable to save session outcome. Please check authorization and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" />
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            Record session outcome for <strong className="text-foreground">{session.studentName}</strong> on{" "}
            <span className="text-foreground">{sessionDateLabel(session)}</span> ({sessionTimeLabel(session)}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {!isCompleted && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
              Are you sure you want to mark this session as <strong>Missed</strong>? This records that the student did not attend the scheduled consultation.
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label htmlFor="counsellor-notes-field" className="font-semibold">
                Session Notes <span className="font-normal">(Optional)</span>
              </label>
              <span className={notes.length > 2000 ? "font-semibold text-destructive" : ""}>
                {notes.length} / 2000
              </span>
            </div>
            <Textarea
              id="counsellor-notes-field"
              placeholder="Add key takeaways, recommendations, or next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={4}
              disabled={isSubmitting}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || notes.length > 2000}
              className={isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                actionLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
