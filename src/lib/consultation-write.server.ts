/**
 * SERVER-ONLY consultation writer (Phase 6C-1).
 *
 * A consultation submission is stored in Supabase in addition to the existing Apps Script /
 * Google Sheet flow. Runs only inside server route handlers, through the service-role client, so
 * RLS stays enabled with no policies and no credential ever reaches the browser.
 *
 * Not an account creation path: no password is stored and no Auth user is created.
 */

import { normalizeEmail } from "@/lib/counsellor-roster";

export type ConsultationRecord = {
  fullName: string;
  phone: string;
  email: string;
  degree: string;
  branch: string;
  graduationYear: string;
  cgpa: string;
  country: string;
  course: string;
  intake: string;
  englishTest: string;
  budget: string;
  message: string;
  /** The exact instant the submission was received (ISO / UTC). */
  submittedAt: Date;
};

export type ConsultationWriteResult = {
  ok: boolean;
  studentId?: string;
  studentCreated?: boolean;
  profileId?: string;
  /** True when an identical submission was already stored moments ago. */
  deduplicated?: boolean;
  error?: string;
};

/**
 * Retry/double-submit protection. The schema has no idempotency key, so identical submissions
 * arriving inside this window are treated as the same submission — in-process first, then
 * confirmed against the database so a second worker cannot insert a duplicate either.
 */
const DEDUPE_WINDOW_MS = 5 * 60_000;
const recent = new Map<string, { at: number; result: ConsultationWriteResult }>();

function fingerprint(r: ConsultationRecord): string {
  return [
    normalizeEmail(r.email),
    r.fullName,
    r.phone,
    r.degree,
    r.branch,
    r.graduationYear,
    r.cgpa,
    r.country,
    r.course,
    r.intake,
    r.englishTest,
    r.budget,
    r.message,
  ]
    .map((v) => (v ?? "").trim())
    .join("|");
}

export async function writeConsultationToSupabase(
  record: ConsultationRecord,
): Promise<ConsultationWriteResult> {
  const key = fingerprint(record);
  const now = Date.now();
  for (const [k, v] of recent) if (now - v.at > DEDUPE_WINDOW_MS) recent.delete(k);
  const seen = recent.get(key);
  if (seen) return { ...seen.result, deduplicated: true };

  const email = normalizeEmail(record.email);
  if (!email) return { ok: false, error: "Missing email" };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /* Student identity: reuse the existing account, never create a second one. */
    const existing = await supabaseAdmin
      .from("students")
      .select("id, email")
      .ilike("email", email)
      .limit(1);
    if (existing.error) throw existing.error;

    let studentId = existing.data?.[0]?.id ?? null;
    let studentCreated = false;

    if (!studentId) {
      const inserted = await supabaseAdmin
        .from("students")
        .insert({
          email,
          full_name: record.fullName,
          account_status: "Active",
          created_at: record.submittedAt.toISOString(),
        })
        .select("id")
        .single();
      if (inserted.error) throw inserted.error;
      studentId = inserted.data.id;
      studentCreated = true;
    }

    /* Cross-instance duplicate guard: identical profile submission stored moments ago. */
    const since = new Date(record.submittedAt.getTime() - DEDUPE_WINDOW_MS).toISOString();
    const dupe = await supabaseAdmin
      .from("student_profiles")
      .select("id")
      .eq("student_id", studentId)
      .eq("phone", record.phone)
      .eq("preferred_course", record.course)
      .eq("additional_info", record.message)
      .gte("created_at", since)
      .limit(1);
    if (!dupe.error && dupe.data && dupe.data.length > 0) {
      const result: ConsultationWriteResult = {
        ok: true,
        studentId,
        studentCreated,
        profileId: dupe.data[0]!.id,
        deduplicated: true,
      };
      recent.set(key, { at: now, result });
      return result;
    }

    /* Every legitimate submission is a new row: historical submissions are never overwritten. */
    const profile = await supabaseAdmin
      .from("student_profiles")
      .insert({
        student_id: studentId,
        email,
        phone: record.phone,
        current_degree: record.degree,
        branch: record.branch,
        graduation_year: record.graduationYear,
        cgpa: record.cgpa,
        preferred_country: record.country,
        preferred_course: record.course,
        preferred_intake: record.intake,
        english_test: record.englishTest,
        budget: record.budget,
        additional_info: record.message,
        // Actual instant, stored as timestamptz — not India local time relabelled as UTC.
        submitted_at: record.submittedAt.toISOString(),
      })
      .select("id")
      .single();
    if (profile.error) throw profile.error;

    const result: ConsultationWriteResult = {
      ok: true,
      studentId,
      studentCreated,
      profileId: profile.data.id,
    };
    recent.set(key, { at: now, result });
    return result;
  } catch (error) {
    // Log server-side only; never surface provider detail or credentials to the browser.
    const message = error instanceof Error ? error.message : String(error);
    console.error("Supabase consultation write failed:", message);
    return { ok: false, error: message };
  }
}
