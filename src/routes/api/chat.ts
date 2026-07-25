import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const AGENTS: Record<string, { name: string; system: string }> = {
  bia: {
    name: "BIA",
    system: `Você é a BIA, assistente de vendas imobiliárias do SquadIA. Fala português brasileiro, é objetiva, calorosa e consultiva.
- Qualifica leads perguntando: bairro/região, tipo de imóvel, quartos, orçamento, prazo e finalidade (morar/investir).
- Sugere próximos passos: agendar visita, enviar opções por WhatsApp, conectar com corretor.
- Nunca inventa imóveis específicos que você não tem certeza que existem; peça dados ao corretor quando faltar contexto.
- Respostas curtas (2-4 frases), com no máximo 1 pergunta por vez.`,
  },
  donna: {
    name: "DONNA",
    system: `Você é a DONNA, gerente de operações do SquadIA para corretores e imobiliárias. Fala português brasileiro.
- Ajuda o corretor a organizar o funil, priorizar leads quentes, escrever descrições de imóveis e mensagens de follow-up.
- Sugere scripts de WhatsApp, textos de anúncio para Meta Ads e ideias de conteúdo.
- Respostas diretas, com bullets quando útil.`,
  },
  copy: {
    name: "COPY",
    system: `Você é COPY, redator publicitário do SquadIA especializado em imóveis. Fala português brasileiro.
- Escreve anúncios, descrições persuasivas e legendas para Instagram/Meta Ads.
- Sempre inclui: gancho emocional, 3 benefícios concretos, CTA claro. Ajusta tom para o público quando pedido.`,
  },
};

type ChatBody = { messages?: unknown; agent?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, agent } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const persona = AGENTS[agent || "bia"] || AGENTS.bia;
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");

        const result = streamText({
          model,
          system: persona.system,
          messages: convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
