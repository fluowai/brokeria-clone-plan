import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerFn } from "@tanstack/react-start";
import { sendWhatsAppMessage, getWhatsAppStatus } from "@/lib/whatsapp.functions";
import { useConversations, useWAConfig, waStore } from "@/lib/whatsapp-store";

export const Route = createFileRoute("/app/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp — SquadIA" },
      { name: "description", content: "Central WhatsApp Cloud API integrada ao CRM." },
    ],
  }),
  component: WhatsAppPage,
});

function WhatsAppPage() {
  const conversations = useConversations();
  const cfg = useWAConfig();
  const send = useServerFn(sendWhatsAppMessage);
  const statusFn = useServerFn(getWhatsAppStatus);
  const [status, setStatus] = useState<{ accessToken: boolean; phoneNumberId: boolean; verifyToken: boolean; appSecret: boolean } | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newTo, setNewTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    statusFn().then(setStatus).catch(() => setStatus(null));
  }, [statusFn]);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updated_at - a.updated_at),
    [conversations],
  );
  const current = sorted.find((c) => c.wa_id === active) ?? null;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/whatsapp/webhook`
      : "/api/public/whatsapp/webhook";

  async function handleSend(to: string, text: string) {
    if (!to || !text.trim()) return;
    setSending(true);
    try {
      const res = await send({ data: { to, text, phoneNumberId: cfg.phoneNumberId || undefined } });
      if (!res.ok) {
        toast.error(res.error || "Falha ao enviar");
        return;
      }
      waStore.upsertMessage(to, {
        id: res.id ?? crypto.randomUUID(),
        from: "me",
        text,
        ts: Date.now(),
        status: "sent",
      });
      setDraft("");
      setActive(to);
      toast.success("Mensagem enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Cloud</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envie e receba mensagens via Meta WhatsApp Business API.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <StatusBadge label="Access Token" ok={!!status?.accessToken} />
          <StatusBadge label="Phone ID" ok={!!status?.phoneNumberId} />
          <StatusBadge label="Verify Token" ok={!!status?.verifyToken} />
          <StatusBadge label="App Secret" ok={!!status?.appSecret} />
        </div>
      </header>

      <Card className="p-5 space-y-3 bg-card/60">
        <h2 className="font-medium">Configuração do webhook Meta</h2>
        <p className="text-sm text-muted-foreground">
          No Meta App Dashboard → WhatsApp → Configuration, use:
        </p>
        <div className="grid gap-2 text-sm">
          <Row label="Callback URL" value={webhookUrl} />
          <Row label="Verify Token" value={status?.verifyToken ? "(definido em WHATSAPP_VERIFY_TOKEN)" : "não configurado"} />
          <Row label="Campos a assinar" value="messages" />
        </div>
        <p className="text-xs text-muted-foreground">
          Secrets necessários no projeto: <code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>, <code>WHATSAPP_VERIFY_TOKEN</code>, <code>WHATSAPP_APP_SECRET</code>.
        </p>
      </Card>

      <div className="grid grid-cols-[320px_1fr] gap-4 min-h-[520px]">
        <Card className="p-3 flex flex-col bg-card/60">
          <div className="p-2 space-y-2 border-b border-border/60">
            <div className="text-xs font-medium text-muted-foreground uppercase">Nova conversa</div>
            <div className="flex gap-2">
              <Input
                placeholder="5511999999999"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => {
                  const to = newTo.replace(/\D/g, "");
                  if (to) {
                    setActive(to);
                    setNewTo("");
                  }
                }}
              >
                Abrir
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto mt-2 space-y-1">
            {sorted.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 text-center">
                Nenhuma conversa ainda. Envie a primeira mensagem ou aguarde recebimento via webhook.
              </div>
            )}
            {sorted.map((c) => (
              <button
                key={c.wa_id}
                onClick={() => {
                  setActive(c.wa_id);
                  waStore.markRead(c.wa_id);
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  active === c.wa_id ? "bg-primary/15" : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{c.name || `+${c.wa_id}`}</span>
                  {c.unread > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.messages[c.messages.length - 1]?.text ?? "—"}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 flex flex-col bg-card/60">
          {active ? (
            <>
              <div className="border-b border-border/60 pb-3 mb-3">
                <div className="font-medium">{current?.name || `+${active}`}</div>
                <div className="text-xs text-muted-foreground">wa_id: {active}</div>
              </div>
              <div className="flex-1 overflow-auto space-y-2 pr-2">
                {(current?.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.from === "me"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-accent"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className="text-[10px] opacity-70 mt-1">
                      {new Date(m.ts).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {(current?.messages.length ?? 0) === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    Sem mensagens. Envie a primeira abaixo.
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(active, draft);
                }}
                className="flex gap-2 mt-3 pt-3 border-t border-border/60"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Enviando..." : "Enviar"}
                </Button>
              </form>
              <p className="text-[11px] text-muted-foreground mt-2">
                Fora da janela de 24h da Meta, só templates aprovados são entregues.
              </p>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Selecione ou abra uma conversa.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "outline"} className={ok ? "" : "text-muted-foreground"}>
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />
      {label}
    </Badge>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-background/60 px-3 py-2 border border-border/60">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <code className="text-xs truncate max-w-[70%]">{value}</code>
    </div>
  );
}
