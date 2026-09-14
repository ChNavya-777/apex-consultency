import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PortalLogin } from "@/components/portal/PortalShell";
import { syncTokenCookie } from "@/lib/portal-auth";

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

        if (role !== "counsellor" && role !== "super_admin") {
          syncTokenCookie(null);
          await supabase.auth.signOut();
          throw new Error("Access denied: Counsellor account required.");
        }

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

