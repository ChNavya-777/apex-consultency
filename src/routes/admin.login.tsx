import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PortalLogin } from "@/components/portal/PortalShell";
import { signInSuperAdmin } from "@/lib/portal-auth";

const title = "Super Admin Login — APEX Global Education Portal";
const description = "Secure sign-in for APEX Global Education super administrators.";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();

  return (
    <PortalLogin
      title="Super Admin Sign In"
      subtitle="Access the APEX operations portal."
      onSubmit={(email, password) => {
        const session = signInSuperAdmin(email, password);
        if (!session) return false;
        navigate({ to: "/admin/dashboard", replace: true });
        return true;
      }}
      footer={
        <Link to="/counsellor/login" className="font-medium text-brand-blue hover:underline">
          Counsellor sign in
        </Link>
      }
    />
  );
}
