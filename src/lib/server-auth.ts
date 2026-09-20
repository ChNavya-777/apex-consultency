/**
 * SERVER-ONLY Supabase Auth & Role Authorization Helpers (Phase 2 - Stage 1).
 *
 * Provides server-side session verification, role authorization, and identity linking.
 * Never exposes the service-role key or credentials to client bundles.
 */

import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export function normalizeEmail(email: string): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Extract bearer token or Supabase Auth session token from incoming Request headers/cookies.
 */
export function extractAuthToken(request?: Request): string | null {
  if (!request) return null;

  // Check Authorization header: Bearer <token>
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (authHeader) {
    const match = /^Bearer\s+([^\s]+)$/i.exec(authHeader.trim());
    if (match?.[1]) return match[1];
  }

  // Check Cookies: sb-access-token or sb-<project_id>-auth-token
  const cookieHeader = request.headers.get("cookie") ?? request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      }),
    );

    if (cookies["sb-access-token"]) return cookies["sb-access-token"];

    // Match any Supabase auth token cookie pattern
    for (const [key, val] of Object.entries(cookies)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token") && typeof val === "string") {
        try {
          const parsed = JSON.parse(val) as any;
          if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
          if (typeof parsed === "object" && parsed !== null && typeof parsed.access_token === "string") {
            return parsed.access_token;
          }
        } catch {
          if (val) return val;
        }
      }
    }
  }

  return null;
}

/**
 * Verify and return the authenticated Supabase Auth user from a server Request.
 */
export async function getAuthenticatedUser(request?: Request) {
  const token = extractAuthToken(request);
  if (!token) return null;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch (error) {
    console.error("Supabase user authentication check failed:", error);
    return null;
  }
}

/**
 * Query user_roles table for the specified user's application role.
 */
export async function getUserRole(userId: string): Promise<AppRole | null> {
  if (!userId) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0]?.role ?? null;
  } catch (error) {
    console.error("Role lookup failed:", error);
    return null;
  }
}

/**
 * Verified user context carrying identity, normalized email, and assigned role.
 */
export type AuthenticatedContext = {
  user: {
    id: string;
    email: string;
  };
  role: AppRole | null;
};

/**
 * Inspect server request and return verified user context, if authenticated.
 */
export async function getAuthenticatedContext(
  request?: Request,
): Promise<AuthenticatedContext | null> {
  const user = await getAuthenticatedUser(request);
  if (!user || !user.email) return null;

  const role = await getUserRole(user.id);
  return {
    user: {
      id: user.id,
      email: normalizeEmail(user.email),
    },
    role,
  };
}

/* ------------------------------------------------------------------ */
/* Identity Linking Helpers (Prepared for Stage 2 Account Cutover)    */
/* ------------------------------------------------------------------ */

/**
 * Link an authenticated user ID to the student table by matching normalized email.
 */
export async function linkStudentByEmail(email: string, authUserId: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized || !authUserId) return false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("students")
      .update({ auth_user_id: authUserId })
      .ilike("email", normalized);

    if (error) {
      console.error(`Failed to link student for ${normalized}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Student linking failed:", error);
    return false;
  }
}

/**
 * Link an authenticated user ID to the counsellors table by matching normalized email.
 */
export async function linkCounsellorByEmail(email: string, authUserId: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized || !authUserId) return false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("counsellors")
      .update({ auth_user_id: authUserId })
      .ilike("email", normalized);

    if (error) {
      console.error(`Failed to link counsellor for ${normalized}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Counsellor linking failed:", error);
    return false;
  }
}

/**
 * Assign an application role to a user in public.user_roles.
 *
 * Compatible with the existing composite unique constraint (user_id, role).
 * Prevents duplicate insertions while blocking silent role conflicts/escalation.
 */
export async function assignUserRole(userId: string, role: AppRole): Promise<boolean> {
  if (!userId || !role) return false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check existing roles assigned to this user
    const { data: existingRoles, error: queryError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (queryError) {
      console.error(
        `Role query failed for user ${userId} [code ${queryError.code}]:`,
        queryError.message,
      );
      return false;
    }

    if (existingRoles && existingRoles.length > 0) {
      const currentRole = existingRoles[0]?.role;
      if (currentRole === role) {
        // Exact role already assigned — idempotent success
        return true;
      }
      // User has a different role assigned — prevent silent override/conflict
      console.error(
        `Role conflict for user ${userId}: requested role "${role}" conflicts with assigned role "${currentRole}".`,
      );
      return false;
    }

    // 2. Insert new role entry matching schema constraint
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (insertError) {
      // 23505 = Unique constraint violation (e.g. concurrent insertion)
      if (insertError.code === "23505") {
        const { data: recheck } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(1);
        if (recheck?.[0]?.role === role) {
          return true;
        }
      }
      console.error(
        `Failed to assign role ${role} to ${userId} [code ${insertError.code}]:`,
        insertError.message,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Role assignment failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

