import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PortalLogin } from "@/components/portal/PortalShell";
import { signInCounsellor } from "@/lib/portal-auth";

const title = "Counsellor Login — APEX Global Education Portal";
const description = "Sign in to your APEX Global Education counsellor workspace.";

export const Route = createFileRoute("/counsellor/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorLoginPage,
});

function CounsellorLoginPage() {
  const navigate = useNavigate();

  return (
    <PortalLogin
      title="Counsellor Sign In"
      subtitle="Access your consultation workspace."
      onSubmit={(email, password) => {
        const session = signInCounsellor(email, password);
        if (!session) return false;
        navigate({ to: "/counsellor/dashboard", replace: true });
        return true;
      }}
      footer={
        <Link to="/admin/login" className="font-medium text-brand-blue hover:underline">
          Super admin sign in
        </Link>
      }
    />
  );
}
