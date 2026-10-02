import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Student consultation submissions are forwarded server-side to the STUDENT
 * Apps Script Web App (which writes to the Student Google Sheet). Proxying
 * avoids browser CORS restrictions — Apps Script does not return CORS headers,
 * so a direct browser fetch cannot read the success response.
 *
 * This is NOT the Calendly / mentor booking deployment; that one is configured
 * inside Calendly and must never be used here.
 */
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwx1NhImXQ9HAC-zSzkkt56ZJteTH7-wN_Q-1nk4quf1SYMQZIiKk7yU2x-6--5xc-4/exec";

// No field is mandatory except email (the signed-in account email used for matching).
const consultationSchema = z.object({
  fullName: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  email: z.string().trim().email("Enter a valid email address."),
  degree: z.string().trim().default(""),
  branch: z.string().trim().default(""),
  graduationYear: z.string().trim().default(""),
  cgpa: z.string().trim().default(""),
  country: z.string().trim().default(""),
  course: z.string().trim().default(""),
  intake: z.string().trim().default(""),
  englishTest: z.string().trim().default(""),
  budget: z.string().trim().default(""),
  message: z.string().trim().default(""),
});

/** "YYYY-MM-DD HH:mm:ss" in Asia/Kolkata (IST) — the Student Sheet's expected format. */
function formatIstTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export const Route = createFileRoute("/api/consultation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { success: false, message: "Invalid JSON body." },
            { status: 400 }
          );
        }

        const parsed = consultationSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            {
              success: false,
              message: "Please check the required fields and try again.",
              issues: parsed.error.flatten(),
            },
            { status: 400 }
          );
        }

        const data = parsed.data;
        // One instant for both destinations: IST wall clock for the sheet, the same
        // instant as timestamptz for Supabase.
        const submittedAt = new Date();
        // Property names expected by the Apps Script Web App.
        const payload = {
          // "Submitted At" is generated here in Asia/Kolkata (IST) so the sheet
          // value never depends on the Apps Script / spreadsheet timezone.
          submittedAt: formatIstTimestamp(submittedAt),
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          currentDegree: data.degree,
          branch: data.branch,
          graduationYear: data.graduationYear,
          cgpa: data.cgpa,
          preferredCountry: data.country,
          preferredCourse: data.course,
          preferredIntake: data.intake,
          ieltsPteStatus: data.englishTest,
          budgetRange: data.budget,
          additionalInfo: data.message,
        };

        /** Apps Script / Google Sheet flow with diagnostic logging. */
        const writeSheet = async (): Promise<{ ok: boolean; message?: string }> => {
          const sheetStart = Date.now();
          try {
            const endpoint =
              process.env["CONSULTATION_APPS_SCRIPT_URL"]?.trim() || APPS_SCRIPT_WEB_APP_URL;
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
              },
              body: JSON.stringify(payload),
              redirect: "follow",
              signal: AbortSignal.timeout(15_000),
            });

            const durationMs = Date.now() - sheetStart;

            if (!response.ok) {
              console.error("[CONSULTATION_SHEET_FAILURE]", {
                status: response.status,
                statusText: response.statusText,
                category:
                  response.status >= 500 ? "UPSTREAM_SERVER_ERROR" : "UPSTREAM_CLIENT_ERROR",
                durationMs,
                emailDomain: data.email.split("@")[1] ?? "unknown",
              });
              return {
                ok: false,
                message:
                  "The submission service is temporarily unavailable. Please try again later.",
              };
            }

            // Treat the submission as successful only when the Apps Script
            // response explicitly reports success.
            const result = (await response.json().catch(() => null)) as
              | { success?: boolean; message?: string }
              | null;

            if (!result || result.success !== true) {
              console.error("[CONSULTATION_SHEET_UNCONFIRMED]", {
                category: "SCRIPT_UNCONFIRMED_SUCCESS",
                durationMs,
                emailDomain: data.email.split("@")[1] ?? "unknown",
              });
              return { ok: false, message: "Your request could not be confirmed. Please try again." };
            }
            return { ok: true };
          } catch (error) {
            const durationMs = Date.now() - sheetStart;
            const isTimeout =
              error instanceof Error &&
              (error.name === "TimeoutError" || error.name === "AbortError");
            console.error("[CONSULTATION_SHEET_ERROR]", {
              category: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_NETWORK_ERROR",
              errorName: error instanceof Error ? error.name : "UnknownError",
              errorMessage: error instanceof Error ? error.message : String(error),
              durationMs,
              emailDomain: data.email.split("@")[1] ?? "unknown",
            });
            return {
              ok: false,
              message: isTimeout
                ? "Network timeout. Please try again."
                : "Network error. Please try again.",
            };
          }
        };

        const { writeConsultationToSupabase } = await import("@/lib/consultation-write.server");

        // Concurrent execution: both writes run in parallel
        const [sheetSettled, dbSettled] = await Promise.allSettled([
          writeSheet(),
          writeConsultationToSupabase({ ...data, submittedAt }),
        ]);

        const sheet =
          sheetSettled.status === "fulfilled"
            ? sheetSettled.value
            : { ok: false, message: "Sheet write rejected" };

        const db =
          dbSettled.status === "fulfilled"
            ? dbSettled.value
            : {
                ok: false,
                error:
                  dbSettled.reason instanceof Error
                    ? dbSettled.reason.message
                    : "Database write rejected",
              };

        // Scenario A & B: Supabase write succeeded (authoritative success condition)
        if (db.ok) {
          if (!sheet.ok) {
            console.warn("[CONSULTATION_DUAL_WRITE_PARTIAL]", {
              database: true,
              sheet: false,
              studentId: db.studentId,
              profileId: db.profileId,
              sheetError: sheet.message,
              emailDomain: data.email.split("@")[1] ?? "unknown",
            });
          }
          return Response.json({
            success: true,
            sheet: sheet.ok,
            database: true,
            studentId: db.studentId,
            profileId: db.profileId,
          });
        }

        // Scenario C: Supabase write failed — genuine submission failure
        console.error("[CONSULTATION_SUBMISSION_FAILED]", {
          database: false,
          sheet: sheet.ok,
          dbError: db.error,
          emailDomain: data.email.split("@")[1] ?? "unknown",
        });

        return Response.json(
          {
            success: false,
            sheet: sheet.ok,
            database: false,
            message: "Submission failed. Please try again.",
          },
          { status: 500 }
        );
      },
    },
  },
});
