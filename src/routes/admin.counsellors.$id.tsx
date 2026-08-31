import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FieldRow,
  PortalCard,
  PortalHeading,
  PortalLayout,
  StatusBadge,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import { Field, Modal, inputClass } from "./admin.counsellors.index";
import {
  resetCounsellorPassword,
  updateCounsellor,
  useCounsellors,
  type AccountStatus,
} from "@/lib/portal-auth";

const title = "Counsellor Detail — APEX Global Education Portal";
const description = "View and manage an individual APEX counsellor account.";

export const Route = createFileRoute("/admin/counsellors/$id")({
  validateSearch: (search: Record<string, unknown>): { edit?: boolean } => ({
    edit: search["edit"] === true || search["edit"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorDetailPage,
});

function CounsellorDetailPage() {
  const session = useRequireRole("super_admin");
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const counsellors = useCounsellors();
  const counsellor = counsellors.find((c) => c.id === id);

  const [editing, setEditing] = useState(edit);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <Link
        to="/admin/counsellors"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to counsellors
      </Link>

      {!counsellor ? (
        <PortalCard>
          <p className="font-display text-base font-semibold text-foreground">
            Counsellor not found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This account no longer exists in the portal.
          </p>
        </PortalCard>
      ) : (
        <>
          <PortalHeading title={counsellor.name} text="Counsellor account details." />

          <PortalCard>
            {editing ? (
              <EditForm
                initial={counsellor}
                onCancel={() => setEditing(false)}
                onSave={(patch) => {
                  updateCounsellor(counsellor.id, patch);
                  setEditing(false);
                  setNotice("Counsellor details updated.");
                }}
              />
            ) : (
              <div>
                <FieldRow label="Name" value={counsellor.name} />
                <FieldRow label="Email" value={counsellor.email} />
                <FieldRow label="Role" value={counsellor.role} />
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </span>
                  <StatusBadge status={counsellor.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => setEditing(true)}>Edit</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetCounsellorPassword(counsellor.email);
                      setNotice("Password reset requested for this counsellor.");
                    }}
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDisable(true)}
                    disabled={counsellor.status === "Disabled"}
                  >
                    Disable Account
                  </Button>
                </div>
              </div>
            )}

            {notice && <p className="mt-4 text-sm font-medium text-brand-blue">{notice}</p>}
          </PortalCard>

          {confirmDisable && (
            <Modal title="Disable this counsellor?" onClose={() => setConfirmDisable(false)}>
              <p className="text-sm text-muted-foreground">
                This counsellor will no longer be able to access the APEX counsellor portal.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmDisable(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateCounsellor(counsellor.id, { status: "Disabled" });
                    setConfirmDisable(false);
                  }}
                >
                  Disable
                </Button>
              </div>
            </Modal>
          )}
        </>
      )}
    </PortalLayout>
  );
}

function EditForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: { name: string; email: string; status: AccountStatus };
  onCancel: () => void;
  onSave: (patch: { name: string; email: string; status: AccountStatus }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [status, setStatus] = useState<AccountStatus>(initial.status);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), email: email.trim(), status });
      }}
    >
      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AccountStatus)}
          className={inputClass}
        >
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
        </select>
      </Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
