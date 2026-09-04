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

const consultationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  email: z.string().trim().email("Enter a valid email address."),
  degree: z.string().trim().min(1, "Current degree is required."),
  branch: z.string().trim().default(""),
  graduationYear: z.string().trim().default(""),
  cgpa: z.string().trim().default(""),
  country: z.string().trim().min(1, "Preferred country is required."),
  course: z.string().trim().default(""),
  intake: z.string().trim().min(1, "Preferred intake is required."),
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
        // Property names expected by the Apps Script Web App.
        const payload = {
          // "Submitted At" is generated here in Asia/Kolkata (IST) so the sheet
          // value never depends on the Apps Script / spreadsheet timezone.
          submittedAt: formatIstTimestamp(new Date()),
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
            // Without this the request can hang until the platform gateway
            // times out, which surfaces to the student as a blank 502 page.
            signal: AbortSignal.timeout(15_000),
          });


          if (!response.ok) {
            console.error(`Apps Script web app failed (${response.status})`);
            return Response.json(
              {
                success: false,
                message: "The submission service is temporarily unavailable. Please try again later.",
              },
              { status: 502 }
            );
          }

          // Treat the submission as successful only when the Apps Script
          // response explicitly reports success.
          const result = (await response.json().catch(() => null)) as
            | { success?: boolean; message?: string }
            | null;

          if (!result || result.success !== true) {
            console.error("Apps Script web app did not confirm success:", result);
            return Response.json(
              {
                success: false,
                message: "Your request could not be confirmed. Please try again.",
              },
              { status: 502 }
            );
          }

          return Response.json({ success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Network error";
          console.error("Apps Script web app network error:", message);
          return Response.json(
            { success: false, message: "Network error. Please try again." },
            { status: 502 }
          );
        }
      },
    },
  },
});
