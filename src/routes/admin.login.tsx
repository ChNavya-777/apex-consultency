import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PortalLogin } from "@/components/portal/PortalShell";
import { syncTokenCookie } from "@/lib/portal-auth";

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
      onSubmit={async (email, password) => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sbError || !sbData.session || !sbData.user) {
          return false;
        }

        syncTokenCookie(sbData.session.access_token);

        let role: string | null = (sbData.user.user_metadata?.role as string) || null;
        if (!role) {
          const { data: roleRow } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", sbData.user.id)
            .maybeSingle();
          role = roleRow?.role ?? null;
        }

        if (role !== "super_admin") {
          syncTokenCookie(null);
          await supabase.auth.signOut();
          throw new Error("Access denied: Super Admin privileges required.");
        }

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

