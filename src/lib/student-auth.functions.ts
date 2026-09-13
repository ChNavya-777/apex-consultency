/**
 * Student account authentication & migration.
 *
 * Provides server-side handling for student login (with legacy Apps Script fallback & on-demand
 * Supabase Auth migration) and new student account creation.
 * Passwords are forwarded once for verification/provisioning and are NEVER logged, stored, or returned.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assignUserRole, getUserRole, linkStudentByEmail, normalizeEmail } from "@/lib/server-auth";

const CREDENTIALS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxF9Qzp3xhw7fhPgby4VjYe5rcp7sDjv8A3xKqVrDkczFNSs7STygKTOl033dvOySbk/exec";

export { normalizeEmail };

type ScriptResult = {
  success?: boolean;
  ok?: boolean;
  status?: string;
  exists?: boolean;
  message?: string;
  name?: string;
  fullName?: string;
  accountStatus?: string;
  student?: { name?: string; fullName?: string; email?: string };
};

async function callScript(payload: Record<string, unknown>): Promise<ScriptResult | null> {
  try {
    const response = await fetch(CREDENTIALS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    if (!response.ok) {
      console.error(`studentcredentials script failed (${response.status})`);
      return null;
    }
    return (await response.json().catch(() => null)) as ScriptResult | null;
  } catch (error) {
    console.error(
      "studentcredentials script network error:",
      error instanceof Error ? error.message : "unknown",
    );
    return null;
  }
}

const succeeded = (r: ScriptResult | null) =>
  !!r && (r.success === true || r.ok === true || r.status === "success");

const pickName = (r: ScriptResult | null) =>
  (r?.name || r?.fullName || r?.student?.name || r?.student?.fullName || "").trim();

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const createSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1).max(120),
});

export type AuthOutcome =
  | { success: true; name: string; email: string; migrated?: boolean }
  | { success: false; message: string };

const GENERIC_CREATE_ERROR =
  "Unable to create this account. Please check your details or use another email.";

export const createStudentAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { fullName: string; email: string; password: string }) =>
    createSchema.parse(input),
  )
  .handler(async ({ data }): Promise<AuthOutcome> => {
    const email = normalizeEmail(data.email);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pre-check Supabase Auth user BEFORE invoking Google Apps Script (prevents orphan credentials)
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = usersData?.users?.find(
      (u) => normalizeEmail(u.email ?? "") === email,
    );
    if (existingAuthUser) {
      return { success: false, message: GENERIC_CREATE_ERROR };
    }

    // Apps Script dual-write (preserves Google credential sheet for temporary transition)
    const existing = await callScript({ action: "checkEmail", email });
    if (existing?.exists === true) {
      return { success: false, message: GENERIC_CREATE_ERROR };
    }

    const created = await callScript({
      action: "createAccount",
      fullName: data.fullName,
      email,
      password: data.password,
    });

    if (!succeeded(created)) {
      return { success: false, message: created?.message || GENERIC_CREATE_ERROR };
    }

    // Provision Supabase Auth User
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, role: "student" },
    });

    if (createErr || !createData.user) {
      console.error("Supabase student user creation failed:", createErr?.message);
      return { success: false, message: GENERIC_CREATE_ERROR };
    }

    const userId = createData.user.id;

    // Assign Role = student
    const roleOk = await assignUserRole(userId, "student");
    if (!roleOk) {
      return { success: false, message: "Role assignment failed." };
    }

    // Link or insert public.students row
    const { data: existingStudentRows } = await supabaseAdmin
      .from("students")
      .select("id, auth_user_id")
      .ilike("email", email)
      .limit(1);

    if (!existingStudentRows || existingStudentRows.length === 0) {
      const { error: insertErr } = await supabaseAdmin.from("students").insert({
        email,
        full_name: data.fullName,
        auth_user_id: userId,
        account_status: "Active",
      });
      if (insertErr) {
        console.error("Failed to insert public.students row:", insertErr.message);
        return { success: false, message: "Failed to initialize student profile." };
      }
    } else {
      const linkOk = await linkStudentByEmail(email, userId);
      if (!linkOk) {
        return { success: false, message: "Failed to link student record." };
      }
    }

    return { success: true, name: pickName(created) || data.fullName, email };
  });

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => credentialsSchema.parse(input))
  .handler(async ({ data }): Promise<AuthOutcome> => {
    const email = normalizeEmail(data.email);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pre-check existing Auth user and role BEFORE performing legacy verification or student linkage
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = usersData?.users?.find(
      (u) => normalizeEmail(u.email ?? "") === email,
    );

    if (existingAuthUser) {
      const existingRole = await getUserRole(existingAuthUser.id);
      if (existingRole && existingRole !== "student") {
        // Staff account (super_admin, counsellor) attempting student login handler -> reject safely
        return { success: false, message: "Invalid email or password." };
      }
    }

    // 1. Verify legacy credential via Apps Script
    const result = await callScript({ action: "login", email, password: data.password });

    if (!succeeded(result)) {
      return { success: false, message: "Invalid email or password." };
    }
    const status = (result?.accountStatus || "").trim().toLowerCase();
    if (status && status !== "active") {
      return { success: false, message: "Invalid email or password." };
    }

    const legacyName = pickName(result);

    // 2. Check existing public.students row for on-demand migration
    const { data: studentRows } = await supabaseAdmin
      .from("students")
      .select("id, auth_user_id, email, full_name")
      .ilike("email", email);

    // Phase 3D: If no students row exists, do not blindly create an unrelated account during legacy migration
    if (!studentRows || studentRows.length === 0) {
      return {
        success: false,
        message: "No matching student record found. Please contact support.",
      };
    }

    const studentRow = studentRows[0]!;

    // Phase 3C: Check if Auth user exists but is linked to a different student
    if (
      existingAuthUser &&
      studentRow.auth_user_id &&
      studentRow.auth_user_id !== existingAuthUser.id
    ) {
      return {
        success: false,
        message: "Account configuration error. Please contact support.",
      };
    }

    let authUserId: string;

    if (existingAuthUser) {
      // Phase 3B: Reuse existing Auth user and update password so browser signInWithPassword succeeds
      authUserId = existingAuthUser.id;
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: data.password,
        email_confirm: true,
      });
      if (updateErr) {
        console.error("Failed to sync password for existing auth user:", updateErr.message);
      }
    } else {
      // Phase 3A: Create new Supabase Auth user
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: legacyName || studentRow.full_name || "",
          role: "student",
        },
      });

      if (createErr || !createData.user) {
        console.error("Failed to provision Supabase Auth user:", createErr?.message);
        return { success: false, message: "Failed to provision authentication account." };
      }
      authUserId = createData.user.id;
    }

    // Phase 4: Role assignment + student linkage
    const roleOk = await assignUserRole(authUserId, "student");
    if (!roleOk) {
      return { success: false, message: "Failed to set student authorization role." };
    }

    const linkOk = await linkStudentByEmail(email, authUserId);
    if (!linkOk) {
      return { success: false, message: "Failed to link student account record." };
    }

    return {
      success: true,
      name: legacyName || studentRow.full_name || "",
      email,
      migrated: true,
    };
  });


