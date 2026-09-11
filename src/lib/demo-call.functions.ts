import { createServerFn } from "@tanstack/react-start";

type DemoCallInput = {
  fullName: string;
  phone: string;
  email: string;
  whatsapp?: string;
};

export const submitDemoCall = createServerFn({ method: "POST" })
  .inputValidator((input: DemoCallInput) => input)
  .handler(async ({ data }): Promise<{ success: boolean; message?: string }> => {
    const url = process.env["DEMO_CALL_WEBHOOK_URL"];
    if (!url) {
      return {
        success: false,
        message: "Demo call booking is not configured. Please try again later.",
      };
    }

    const payload = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email.trim().toLowerCase(),
      whatsapp: data.whatsapp ?? "",
      submittedAt: new Date().toISOString(),
      source: "apex-website-demo-call",
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await response.text();

      if (!response.ok) {
        return {
          success: false,
          message: `Webhook failed (${response.status}): ${responseText}`,
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
