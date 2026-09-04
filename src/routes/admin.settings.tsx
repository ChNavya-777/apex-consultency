import { createFileRoute } from "@tanstack/react-router";
import {
  FieldRow,
  PortalCard,
  PortalHeading,
  PortalLayout,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { adminNav } from "@/components/portal/nav";

const title = "Settings — APEX Global Education Portal";
const description = "Portal account and integration settings.";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const session = useRequireRole("super_admin");
  if (!session) return null;

  return (
    <PortalLayout session={session} nav={adminNav}>
      <PortalHeading title="Settings" text="Your account and planned data connections." />

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalCard>
          <h2 className="mb-2 font-display text-base font-semibold text-foreground">Account</h2>
          <FieldRow label="Name" value={session.name} />
          <FieldRow label="Email" value={session.email} />
          <FieldRow label="Role" value="Super Admin" />
        </PortalCard>

        <PortalCard>
          <h2 className="mb-2 font-display text-base font-semibold text-foreground">
            Data connections
          </h2>
          <FieldRow label="Student enquiries" value="Student Google Sheet — read-only (sheet ID pending)" />
          <FieldRow label="Sessions" value="Calendly → Booking Google Sheet — connected (read-only)" />
          <FieldRow label="Authentication" value="Prototype — provider not connected" />
          <p className="mt-4 text-sm text-muted-foreground">
            Booking data is read live from the Booking Sheet. Student profile details require the
            Student Sheet ID.
          </p>

        </PortalCard>
      </div>
    </PortalLayout>
  );
}
