import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PortalCard,
  PortalHeading,
  PortalLayout,
  StatusBadge,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";
import { addCounsellor, updateCounsellor, useCounsellors, type Counsellor } from "@/lib/portal-auth";

const title = "Counsellors — APEX Global Education Portal";
const description = "Manage counsellor accounts and access for the APEX counsellor portal.";

export const Route = createFileRoute("/admin/counsellors/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCounsellorsPage,
});

function AdminCounsellorsPage() {
  const session = useRequireRole("super_admin");
  const counsellors = useCounsellors();
  const [showAdd, setShowAdd] = useState(false);
  const [toDisable, setToDisable] = useState<Counsellor | null>(null);

  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading
        title="Counsellors"
        text="Manage counsellor accounts and access."
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Counsellor
          </Button>
        }
      />

      <PortalCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {["Name", "Email", "Role", "Status", "Actions"].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {counsellors.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                    {c.name}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{c.email}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{c.role}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/counsellors/$id" params={{ id: c.id }}>
                          View
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          to="/admin/counsellors/$id"
                          params={{ id: c.id }}
                          search={{ edit: true }}
                        >
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToDisable(c)}
                        disabled={c.status === "Disabled"}
                      >
                        Disable
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>

      {showAdd && (
        <Modal title="Add Counsellor" onClose={() => setShowAdd(false)}>
          <AddCounsellorForm onDone={() => setShowAdd(false)} />
        </Modal>
      )}

      {toDisable && (
        <Modal title="Disable this counsellor?" onClose={() => setToDisable(null)}>
          <p className="text-sm text-muted-foreground">
            This counsellor will no longer be able to access the APEX counsellor portal.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDisable(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateCounsellor(toDisable.id, { status: "Disabled" });
                setToDisable(null);
              }}
            >
              Disable
            </Button>
          </div>
        </Modal>
      )}
    </PortalLayout>
  );
}

function AddCounsellorForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Disabled">("Active");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        addCounsellor({ name: name.trim(), email: email.trim(), password, status });
        onDone();
      }}
    >
      <Field label="Full Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Email Address">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Temporary Password">
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Role">
        <input readOnly value="Counsellor" className={`${inputClass} bg-muted`} />
      </Field>
      <Field label="Status">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "Active" | "Disabled")}
          className={inputClass}
        >
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
        </select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Create Counsellor</Button>
      </div>
    </form>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}
