/**
 * Student account authentication (studentcredentials Google Sheet).
 *
 * The Apps Script Web App URL lives ONLY on the server: the browser calls these server
 * functions, never the script directly. Passwords are forwarded once for hashing/verification
 * by the Apps Script and are never stored, logged or returned.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CREDENTIALS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxF9Qzp3xhw7fhPgby4VjYe5rcp7sDjv8A3xKqVrDkczFNSs7STygKTOl033dvOySbk/exec";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
  | { success: true; name: string; email: string }
  | { success: false; message: string };

const GENERIC_CREATE_ERROR =
  "Unable to create this account. Please check your details or use another email.";

export const createStudentAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { fullName: string; email: string; password: string }) =>
    createSchema.parse(input),
  )
  .handler(async ({ data }): Promise<AuthOutcome> => {
    const email = normalizeEmail(data.email);

    const existing = await callScript({ action: "checkEmail", email });
    if (existing && (existing.exists === true || succeeded(existing))) {
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

    return { success: true, name: pickName(created) || data.fullName, email };
  });

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => credentialsSchema.parse(input))
  .handler(async ({ data }): Promise<AuthOutcome> => {
    const email = normalizeEmail(data.email);
    const result = await callScript({ action: "login", email, password: data.password });

    if (!succeeded(result)) {
      return { success: false, message: "Invalid email or password." };
    }
    const status = (result?.accountStatus || "").trim().toLowerCase();
    if (status && status !== "active") {
      return { success: false, message: "Invalid email or password." };
    }

    return { success: true, name: pickName(result), email };
  });
