import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const demoCallSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().max(30).optional().default(""),
});

export type DemoCallOutcome = { success: boolean; message?: string };

export const submitDemoCall = createServerFn({ method: "POST" })
  .inputValidator((input: { fullName: string; phone: string; email: string; whatsapp?: string }) =>
    demoCallSchema.parse(input),
  )
  .handler(async ({ data }): Promise<DemoCallOutcome> => {
    const url = process.env["DEMO_CALL_WEBHOOK_URL"];
    if (!url) {
      return { success: false, message: "Demo call webhook is not configured." };
    }

    const payload = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email.toLowerCase(),
      whatsapp: data.whatsapp || "",
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          message: `Submission failed (${response.status}). Please try again.`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Network error. Please try again.",
      };
    }
  });
