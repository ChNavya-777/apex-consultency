import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Consultation submissions are forwarded server-side to the Google Apps Script
 * Web App (which writes to the client's Google Sheet). Proxying avoids browser
 * CORS restrictions — Apps Script does not return CORS headers, so a direct
 * browser fetch cannot read the success response.
 */
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxWEv930p5v-w_GuUGIwiw8FsERhiQpRk9k8yWRe4JUCUqJH6MG1lfehXa81HYW4tKB4A/exec";

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
          const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
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
