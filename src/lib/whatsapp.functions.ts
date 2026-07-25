import { createServerFn } from "@tanstack/react-start";

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .inputValidator((input: { to: string; text: string; phoneNumberId?: string }) => {
    if (!input || typeof input.to !== "string" || typeof input.text !== "string") {
      throw new Error("invalid input");
    }
    const to = input.to.replace(/[^\d]/g, "");
    if (!to) throw new Error("invalid phone");
    const text = input.text.trim();
    if (!text) throw new Error("empty text");
    if (text.length > 4096) throw new Error("text too long");
    return { to, text, phoneNumberId: input.phoneNumberId };
  })
  .handler(async ({ data }) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = data.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      return {
        ok: false as const,
        error: "WhatsApp não configurado. Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID.",
      };
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: data.to,
        type: "text",
        text: { preview_url: false, body: data.text },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return { ok: false as const, error: json?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true as const, id: json?.messages?.[0]?.id as string | undefined };
  });

export const getWhatsAppStatus = createServerFn({ method: "GET" }).handler(async () => {
  return {
    accessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: !!process.env.WHATSAPP_APP_SECRET,
  };
});
