import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/app/ai")({
  head: () => ({
    meta: [
      { title: "Agentes IA — SquadIA" },
      { name: "description", content: "Converse com BIA, DONNA e COPY: agentes de IA para vendas, operações e copywriting imobiliário." },
      { property: "og:title", content: "Agentes IA — SquadIA" },
      { property: "og:description", content: "Time de agentes IA para o corretor." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <AIChatPage />
      <Toaster />
    </AuthProvider>
  ),
});

const AGENTS = [
  { id: "bia", name: "BIA", role: "Vendas & atendimento", accent: "bg-primary/20 text-primary border-primary/40" },
  { id: "donna", name: "DONNA", role: "Gerente de operações", accent: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  { id: "copy", name: "COPY", role: "Redator de anúncios", accent: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
] as const;

type AgentId = (typeof AGENTS)[number]["id"];

function AIChatPage() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentId>("bia");
  const storageKey = user ? `squadia.ai.${user.id}.${agent}` : "";
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setInitialMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setInitialMessages([]);
    }
    setLoaded(true);
  }, [storageKey]);

  if (!user || !loaded) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Agentes IA</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seu time de IA sempre pronto. Escolha um agente para conversar.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAgent(a.id)}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              agent === a.id ? a.accent : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="font-medium">{a.name}</div>
            <div className="text-xs opacity-80">{a.role}</div>
          </button>
        ))}
      </div>

      <ChatWindow key={agent} agent={agent} storageKey={storageKey} initialMessages={initialMessages} />
    </div>
  );
}

function ChatWindow({
  agent, storageKey, initialMessages,
}: { agent: AgentId; storageKey: string; initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: `${storageKey}`,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { agent } }),
    onError: (e) => toast.error(e.message || "Erro no agente"),
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [agent, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = async () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  const clear = () => {
    setMessages([]);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  return (
    <Card className="mt-6 p-0 overflow-hidden bg-card/60 border-border/60 flex flex-col h-[calc(100vh-260px)] min-h-[420px]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <span>Conversando com <strong className="text-foreground">{AGENTS.find((a) => a.id === agent)!.name}</strong></span>
        <button className="hover:text-foreground" onClick={clear} disabled={messages.length === 0}>Limpar conversa</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Diga algo para começar. Ex.: "Me ajude a qualificar esse lead: ..."
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              {isUser ? (
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2 text-sm whitespace-pre-wrap">
                  {text}
                </div>
              ) : (
                <div className="max-w-[85%] text-sm prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
        {busy && (
          <div className="text-sm text-muted-foreground animate-pulse">Pensando...</div>
        )}
      </div>

      <div className="border-t border-border/60 p-3 flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={`Mensagem para ${AGENTS.find((a) => a.id === agent)!.name}...`}
          rows={2}
          className="flex-1 resize-none"
          disabled={busy}
        />
        <Button onClick={submit} disabled={busy || !input.trim()}>
          {busy ? "..." : "Enviar"}
        </Button>
      </div>
    </Card>
  );
}
