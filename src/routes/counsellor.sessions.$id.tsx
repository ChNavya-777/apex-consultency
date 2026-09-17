import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, XCircle, Edit3 } from "lucide-react";
import { PortalHeading, PortalLayout, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { SessionDetail, SessionEmptyState } from "@/components/sessions/SessionUI";
import { SessionOutcomeModal } from "@/components/sessions/SessionOutcomeModal";
import { canRecordSessionOutcome, findSession, type CounsellorOutcome } from "@/lib/sessions";
import { useCounsellorPortalData } from "@/lib/use-portal-data";

const title = "Consultation Details — APEX Global Education Portal";
const description = "Details of a consultation assigned to you.";

export const Route = createFileRoute("/counsellor/sessions/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorSessionDetailPage,
});

function CounsellorSessionDetailPage() {
  const session = useRequireRole("counsellor");
  const { id } = Route.useParams();
  const { data, isLoading } = useCounsellorPortalData(session?.email);
  const [modalOutcome, setModalOutcome] = useState<CounsellorOutcome | null>(null);

  if (!session) return null;

  /** Looked up only within this counsellor's own (server-filtered) sessions. */
  const record = findSession(data.sessions, id);

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <Link
        to="/counsellor/sessions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my sessions
      </Link>

      <PortalHeading title="Consultation Details" />

      {record ? (
        <>
          <SessionDetail
            session={record}
            audience="counsellor"
            studentAction={
              <Link
                to="/counsellor/students"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                View Student
              </Link>
            }
            outcomeAction={
              <div className="flex flex-wrap items-center gap-2">
                {canRecordSessionOutcome(record) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalOutcome("completed")}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOutcome("missed")}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 shadow-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      Mark Missed
                    </button>
                  </>
                ) : record.counsellorOutcome ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalOutcome("completed")}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {record.counsellorOutcome === "completed" ? "Completed" : "Mark Completed"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOutcome("missed")}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 shadow-sm"
                    >
                      <XCircle className="h-4 w-4" />
                      {record.counsellorOutcome === "missed" ? "Missed" : "Mark Missed"}
                    </button>
                    <span className="text-xs text-muted-foreground ml-2">
                      Outcome recorded ({record.counsellorOutcome === "completed" ? "Completed" : "Missed"}). Click above to edit outcome or notes.
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Outcome actions will become available once the scheduled session time ends.
                  </span>
                )}
              </div>
            }
          />

          {modalOutcome && (
            <SessionOutcomeModal
              session={record}
              targetOutcome={modalOutcome}
              isOpen={!!modalOutcome}
              onClose={() => setModalOutcome(null)}
            />
          )}
        </>
      ) : (
        <SessionEmptyState
          title={isLoading ? "Loading consultation…" : "Consultation not found"}
          text="This session isn't available to you."
          action={
            <Link
              to="/counsellor/sessions"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Back to my sessions
            </Link>
          }
        />
      )}
    </PortalLayout>
  );
}

