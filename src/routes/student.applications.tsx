import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  GraduationCap,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Award,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  ApplicationTimeline,
  EmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import { useStudentPortalData, useUpdateOfferDecisionStatus, useGetDocumentDownloadUrl } from "@/lib/use-portal-data";
import {
  SHORTLIST_CATEGORIES,
  shortlistCategoryLabels,
  shortlistStatusLabels,
  applicationStatusLabels,
  offerTypeLabels,
  offerDecisionStatusLabels,
  isDeadlineOverdue,
  isDeadlineDueSoon,
  type StudentShortlist,
  type StudentApplication,
  type OfferDecisionStatus,
} from "@/lib/student-applications";

const title = "My Applications & Universities — APEX Student Portal";
const description = "Track your university shortlists, applications, and offers with APEX Global Education.";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentApplicationsPage,
});

function StudentApplicationsPage() {
  const session = useRequireStudent();
  const { data, isLoading, refetch } = useStudentPortalData(session?.email);
  const updateOfferDecisionMutation = useUpdateOfferDecisionStatus();
  const getDownloadUrlMutation = useGetDocumentDownloadUrl();

  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!session) return null;

  const shortlists: StudentShortlist[] = data.shortlists || [];
  const applications: StudentApplication[] = data.applications || [];

  const offers = applications
    .filter((a) => a.offer !== null)
    .map((a) => ({
      application: a,
      offer: a.offer!,
    }));

  async function handleOfferDecision(offerId: string, decisionStatus: OfferDecisionStatus) {
    setUpdatingOfferId(offerId);
    setDecisionFeedback(null);
    try {
      await updateOfferDecisionMutation.mutateAsync({
        offerId,
        decisionStatus,
      });
      setDecisionFeedback({
        type: "success",
        message: decisionStatus === "accepted" ? "🎉 Offer accepted! Your counsellor has been notified." : "Offer decision updated.",
      });
      refetch();
    } catch (err: any) {
      setDecisionFeedback({
        type: "error",
        message: err?.message || "Failed to update offer decision.",
      });
    } finally {
      setUpdatingOfferId(null);
    }
  }

  async function handleDownloadOfferLetter(docId: string, filename?: string | null) {
    setDownloadingDocId(docId);
    try {
      const res = await getDownloadUrlMutation.mutateAsync({
        documentId: docId,
        downloadFilename: filename || "Offer_Letter.pdf",
      });
      if (res.url) {
        window.open(res.url, "_blank");
      }
    } catch (err: any) {
      alert("Failed to download offer letter: " + (err?.message || "Error"));
    } finally {
      setDownloadingDocId(null);
    }
  }

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading
        title="My Universities & Applications"
        text="Follow each university from shortlist to application and final offer decision."
      />

      {decisionFeedback && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl border p-3.5 text-sm ${
            decisionFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{decisionFeedback.message}</span>
          <button
            onClick={() => setDecisionFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading applications & shortlists...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Offers & Admission Decisions */}
          {offers.length > 0 && (
            <StudentCard title="Offers & Admission Decisions" icon={Award}>
              <div className="space-y-4">
                {offers.map(({ application, offer }) => {
                  const isPending = offer.decisionStatus === "pending";
                  const isUpdating = updatingOfferId === offer.id;

                  return (
                    <div
                      key={offer.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        offer.offerType === "unconditional"
                          ? "border-emerald-200 bg-emerald-50/40"
                          : offer.offerType === "conditional"
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg font-bold text-foreground">
                              {application.universityName}
                            </span>
                            <span className="text-xs text-muted-foreground">({application.universityCountry})</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {application.courseName} · <span className="text-muted-foreground">{application.degreeLevel} ({application.intake})</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                              offer.offerType === "unconditional"
                                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                : offer.offerType === "conditional"
                                ? "border-amber-300 bg-amber-100 text-amber-800"
                                : offer.offerType === "waitlisted"
                                ? "border-blue-300 bg-blue-100 text-blue-800"
                                : "border-red-300 bg-red-100 text-red-800"
                            }`}
                          >
                            {offerTypeLabels[offer.offerType]}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              offer.decisionStatus === "accepted"
                                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                : offer.decisionStatus === "declined"
                                ? "border-red-300 bg-red-100 text-red-800"
                                : "border-amber-300 bg-amber-100 text-amber-800"
                            }`}
                          >
                            {offerDecisionStatusLabels[offer.decisionStatus]}
                          </span>
                        </div>
                      </div>

                      {offer.conditions && (
                        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-xs text-amber-900">
                          <strong className="font-semibold">Offer Conditions:</strong> {offer.conditions}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-4">
                          {offer.depositRequired && (
                            <span>
                              Deposit: <strong className="text-foreground">${offer.depositAmount ?? 0}</strong>
                              {offer.depositDeadline && ` (Due: ${new Date(offer.depositDeadline).toLocaleDateString()})`}
                            </span>
                          )}

                          {offer.offerLetterDocumentId && (
                            <button
                              type="button"
                              onClick={() => handleDownloadOfferLetter(offer.offerLetterDocumentId!, offer.offerLetterFilename)}
                              disabled={downloadingDocId === offer.offerLetterDocumentId}
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {downloadingDocId === offer.offerLetterDocumentId ? "Loading..." : offer.offerLetterFilename || "Download Offer Letter"}
                            </button>
                          )}
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOfferDecision(offer.id, "accepted")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Accept Offer
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOfferDecision(offer.id, "declined")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-surface disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </StudentCard>
          )}

          {/* Section 2: Active Applications */}
          <StudentCard title="Active Applications" icon={GraduationCap}>
            {applications.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No active applications yet"
                text="Your university applications will appear here once your application process begins with your counsellor."
              />
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const overdue = isDeadlineOverdue(app.applicationDeadline, app.status);
                  const dueSoon = isDeadlineDueSoon(app.applicationDeadline, app.status);

                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-foreground">
                              {app.universityName}
                            </span>
                            <span className="text-xs text-muted-foreground">({app.universityCountry})</span>
                          </div>

                          <p className="mt-0.5 text-sm font-medium text-foreground">
                            {app.courseName} · <span className="text-muted-foreground">{app.degreeLevel} ({app.intake})</span>
                          </p>

                          {app.applicationNumber && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              App No: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{app.applicationNumber}</code>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                              app.status === "submitted"
                                ? "border-blue-200 bg-blue-50 text-blue-800"
                                : app.status === "under_review"
                                ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                                : app.status === "action_required"
                                ? "border-red-200 bg-red-50 text-red-800 animate-pulse"
                                : app.status === "decision_received"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-gray-200 bg-gray-50 text-gray-800"
                            }`}
                          >
                            {applicationStatusLabels[app.status]}
                          </span>

                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              <AlertCircle className="h-3 w-3" /> Overdue
                            </span>
                          )}

                          {dueSoon && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              <Clock className="h-3 w-3" /> Due Soon
                            </span>
                          )}
                        </div>
                      </div>

                      {app.notes && (
                        <p className="mt-3 text-xs italic text-muted-foreground">
                          "{app.notes}"
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-4">
                          {app.submissionDate && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> Submitted: {new Date(app.submissionDate).toLocaleDateString()}
                            </span>
                          )}

                          {app.applicationDeadline && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> Deadline: {new Date(app.applicationDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {app.offer && (
                          <span className="font-medium text-emerald-700">
                            Offer Attached ({offerTypeLabels[app.offer.offerType]})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </StudentCard>

          {/* Section 3: Shortlisted Universities */}
          <StudentCard title="Shortlisted Universities & Programs" icon={Building2}>
            {shortlists.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No shortlisted universities"
                text="Your shortlisted target universities will be displayed here as you explore programs with your counsellor."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {shortlists.map((sl) => {
                  const catConfig = SHORTLIST_CATEGORIES.find((c) => c.key === sl.category);

                  return (
                    <div
                      key={sl.id}
                      className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display text-base font-semibold text-foreground">
                            {sl.universityName}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              catConfig?.badgeClass || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {shortlistCategoryLabels[sl.category]}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {sl.universityCountry} {sl.universityCity ? `· ${sl.universityCity}` : ""}
                        </p>

                        <div className="mt-3 rounded-lg bg-surface p-3 text-xs">
                          <p className="font-semibold text-foreground">{sl.courseName}</p>
                          <p className="text-muted-foreground">
                            {sl.degreeLevel} · Intake: <strong className="text-foreground">{sl.intake}</strong>
                          </p>
                        </div>

                        {sl.notes && (
                          <p className="mt-2 text-xs italic text-muted-foreground">
                            Note: {sl.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                        <span className="text-muted-foreground">
                          Status: <strong className="text-foreground capitalize">{shortlistStatusLabels[sl.status]}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </StudentCard>

          {/* Section 4: Process Guidance */}
          <StudentCard title="How your application journey works">
            <ApplicationTimeline note="Each application will move through these steps, and your progress will update here in real-time." />
          </StudentCard>
        </div>
      )}
    </StudentLayout>
  );
}
