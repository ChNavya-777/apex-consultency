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

  console.log("n8n status:", response.status);
  console.log("n8n response:", responseText);

  if (!response.ok) {
    return {
      success: false,
      message: `Webhook failed (${response.status}): ${responseText}`,
    };
  }

  return {
    success: true,
  };
} catch (error) {
  return {
    success: false,
    message: error instanceof Error ? error.message : "Network error. Please try again.",
  };
}
