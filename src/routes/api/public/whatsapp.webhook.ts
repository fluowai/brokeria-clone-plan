import { createFileRoute } from "@tanstack/react-router";

// Meta WhatsApp Cloud API webhook.
// GET: verification challenge. POST: incoming messages / status callbacks.
// Configure webhook URL as: https://<your-domain>/api/public/whatsapp/webhook
// This path is public (auth bypassed) — signature verification is done below.

async function verifyMetaSignature(request: Request, rawBody: string): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // dev mode: allow without secret set
  const sigHeader = request.headers.get("x-hub-signature-256");
  if (!sigHeader?.startsWith("sha256=")) return false;
  const provided = sigHeader.slice(7);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env.WHATSAPP_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const ok = await verifyMetaSignature(request, rawBody);
        if (!ok) return new Response("invalid signature", { status: 401 });

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("bad json", { status: 400 });
        }

        // Log for now — persistence layer (Fase 2) will land when Cloud is added.
        // Structure per Meta docs: entry[].changes[].value.messages[]
        try {
          const entries = payload?.entry ?? [];
          for (const entry of entries) {
            for (const change of entry.changes ?? []) {
              const value = change.value ?? {};
              const contacts = value.contacts ?? [];
              const messages = value.messages ?? [];
              for (const m of messages) {
                const contact = contacts.find((c: any) => c.wa_id === m.from);
                console.log("[wa:in]", {
                  from: m.from,
                  name: contact?.profile?.name,
                  type: m.type,
                  text: m.text?.body,
                  ts: m.timestamp,
                });
              }
              for (const s of value.statuses ?? []) {
                console.log("[wa:status]", { id: s.id, status: s.status });
              }
            }
          }
        } catch (e) {
          console.error("[wa:webhook] parse error", e);
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
