import { createFileRoute } from "@tanstack/react-router";
import {
  FieldRow,
  PortalCard,
  PortalHeading,
  PortalLayout,
  StatusBadge,
  useRequireRole,
} from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { useCounsellors } from "@/lib/portal-auth";

const title = "My Profile — APEX Global Education Portal";
const description = "Your APEX counsellor account details.";

export const Route = createFileRoute("/counsellor/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorProfilePage,
});

function CounsellorProfilePage() {
  const session = useRequireRole("counsellor");
  const counsellors = useCounsellors();
  if (!session) return null;

  const record = counsellors.find((c) => c.id === session.counsellorId);

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <PortalHeading title="Profile" text="Your account details." />

      <PortalCard>
        <FieldRow label="Name" value={session.name} />
        <FieldRow label="Email" value={session.email} />
        <FieldRow label="Role" value="Counsellor" />
        <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account Status
          </span>
          <StatusBadge status={record?.status ?? "Active"} />
        </div>
      </PortalCard>
    </PortalLayout>
  );
}
