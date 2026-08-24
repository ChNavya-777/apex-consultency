import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const WEBHOOK_URL =
  "https://benzz123.app.n8n.cloud/webhook/eca9cb6a-a2a4-46ce-b931-19d490499a15";

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
        const payload = {
          full_name: data.fullName,
          phone: data.phone,
          email: data.email,
          current_degree: data.degree,
          branch_specialisation: data.branch,
          graduation_year: data.graduationYear,
          cgpa_percentage: data.cgpa,
          preferred_country: data.country,
          preferred_course: data.course,
          preferred_intake: data.intake,
          ielts_pte_status: data.englishTest,
          budget_range: data.budget,
          additional_information: data.message,
        };

        try {
          const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const text = await response.text().catch(() => "Unknown webhook error");
            console.error(`n8n webhook failed (${response.status}): ${text}`);
            return Response.json(
              {
                success: false,
                message: "The submission service is temporarily unavailable. Please try again later.",
              },
              { status: 502 }
            );
          }

          return Response.json({ success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Network error";
          console.error("n8n webhook network error:", message);
          return Response.json(
            { success: false, message: "Network error. Please try again." },
            { status: 502 }
          );
        }
      },
    },
  },
});
