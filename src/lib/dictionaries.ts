export type Locale = "pt" | "en" | "es";

type Agent = { name: string; role: string; kpi: string; kpiLabel: string };
type Plan = {
  name: string;
  tagline: string;
  price: string;
  cta: string;
  highlight?: string;
  agents: string[];
  features: string[];
  quotas: string[];
};
type Faq = { q: string; a: string };

export type Dict = {
  nav: { agent: string; agency: string; developer: string; pricing: string; faq: string; login: string; trial: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    bullet: string;
    body: string;
    cta: string;
    ctaGhost: string;
    trustA: string;
    trustB: string;
  };
  agents: { title: string; subtitle: string; items: Agent[] };
  cockpit: {
    title: string;
    subtitle: string;
    ownerLabel: string;
    date: string;
    tabs: string[];
    stats: { label: string; value: string; hint: string }[];
    financials: string;
    vgv: string; vgc: string; roi: string;
    bottlenecks: string;
    goals: string;
  };
  fronts: { title: string; subtitle: string; items: { title: string; body: string; bullets: string[]; punch: string }[] };
  integrations: { title: string; subtitle: string; live: string; loading: string; items: { name: string; kind: string; status: "live" | "loading" }[] };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    autonomous: string;
    plans: Plan[];
    enterprise: { title: string; body: string; cta: string };
  };
  faq: { title: string; items: Faq[] };
  trial: {
    title: string; subtitle: string;
    name: string; company: string; role: string; email: string; phone: string; submit: string; disclaimer: string;
    roles: string[];
    success: string; error: string;
  };
  footer: { rights: string; contact: string; product: string; company: string };
  common: { language: string };
};

const pt: Dict = {
  nav: { agent: "Corretor", agency: "Imobiliária", developer: "Incorporador", pricing: "Planos", faq: "FAQ", login: "Entrar", trial: "Testar grátis" },
  hero: {
    eyebrow: "AI First — como as grandes proptechs",
    title: "Contrate um time de IA que roda sua operação 24/7.",
    subtitle: "A tecnologia certa. Os talentos certos. Mais resultado com menos recurso.",
    bullet: "Usuários ilimitados em todos os planos — você não paga por corretor.",
    body: "BIA responde leads no WhatsApp em 30s. DONNA é copiloto proativo de cada corretor. PIXEL gera leads no Meta Ads. JOTA traz os números. LINK conecta portais. Seu corretor só entra para fechar.",
    cta: "Falar com a BIA agora",
    ctaGhost: "Ver o squad em ação",
    trustA: "Meta Business Partner",
    trustB: "API oficial do WhatsApp",
  },
  agents: {
    title: "Cada agente com nome e função.",
    subtitle: "Um squad completo pelo custo de uma contratação.",
    items: [
      { name: "BIA", role: "SDR de plantão no WhatsApp", kpi: "< 30s", kpiLabel: "primeira resposta 24/7" },
      { name: "DONNA", role: "Copiloto proativo do corretor", kpi: "∞", kpiLabel: "para todos os usuários" },
      { name: "PIXEL", role: "Gestor de Meta Ads", kpi: "−15 a −30%", kpiLabel: "de CPL em 14 dias" },
      { name: "JOTA", role: "Analista de BI", kpi: "100%", kpiLabel: "do funil em tempo real" },
      { name: "LINK", role: "Conector de portais", kpi: "99,5%+", kpiLabel: "dos leads captados" },
      { name: "CARTA", role: "Email marketing", kpi: "+20–30%", kpiLabel: "de leads frios reativados" },
      { name: "BRAIN", role: "Cérebro exclusivo Pro", kpi: "MCP", kpiLabel: "ações em todo o CRM" },
    ],
  },
  cockpit: {
    title: "Seu cockpit em tempo real.",
    subtitle: "Do primeiro clique ao contrato — o funil inteiro em uma tela.",
    ownerLabel: "Cockpit do Owner",
    date: "Visão global · Janeiro 2026",
    tabs: ["Hoje", "7 dias", "Mês"],
    stats: [
      { label: "Leads", value: "265", hint: "+12% vs mês passado" },
      { label: "Agendamentos", value: "98", hint: "37% de conversão" },
      { label: "Aprovados", value: "39", hint: "Pipeline quente" },
      { label: "Vendas", value: "14", hint: "Meta batida 🏆" },
    ],
    financials: "Financeiro do mês",
    vgv: "VGV",
    vgc: "VGC",
    roi: "ROI",
    bottlenecks: "Gargalos & alertas",
    goals: "Metas & copiloto",
  },
  fronts: {
    title: "3 frentes que crescem receita e cortam custos.",
    subtitle: "Seu pipeline anda sozinho com IA. Seu time foca no que importa.",
    items: [
      {
        title: "Atendimento omnichannel",
        body: "Todo lead respondido na hora, em qualquer canal.",
        bullets: ["WhatsApp, Instagram, Facebook e TikTok num só fluxo", "IA responde e qualifica em linguagem natural", "Follow-ups inteligentes que resgatam leads"],
        punch: "⚡ Responda em segundos enquanto o concorrente demora horas.",
      },
      {
        title: "Pipeline previsível",
        body: "CRM sem digitação: a IA atualiza tudo sozinha.",
        bullets: ["Move o lead do primeiro contato até a venda", "Registra financiamento, objeções e etapas", "Alertas de gargalo (SLA, análise parada)"],
        punch: "⚡ Seu time vende. Concorrente ainda está digitando.",
      },
      {
        title: "Gestão de marketing",
        body: "Saiba onde o dinheiro vira venda.",
        bullets: ["Custo por etapa do funil (não só por lead)", "Quais campanhas geram agendamento e venda", "Menos desperdício, mais ROI"],
        punch: "⚡ Saiba onde investir antes de todo mundo.",
      },
    ],
  },
  integrations: {
    title: "Integrações prontas para escalar.",
    subtitle: "Só mostramos o que já roda em produção. Sem promessa vazia.",
    live: "Ao vivo",
    loading: "Em breve",
    items: [
      { name: "WhatsApp", kind: "Meta Cloud API", status: "live" },
      { name: "Instagram", kind: "Direct Messages", status: "live" },
      { name: "Facebook", kind: "Messenger", status: "live" },
      { name: "TikTok", kind: "Leads Ads", status: "loading" },
      { name: "Formulários", kind: "Site & landing", status: "live" },
      { name: "OLX / ZAP", kind: "Grupo OLX", status: "live" },
      { name: "VivaReal", kind: "Portais", status: "live" },
      { name: "Meta Ads", kind: "CAPI + otimização", status: "live" },
    ],
  },
  pricing: {
    title: "Contrate seu time de IA.",
    subtitle: "Cada plano é um squad trabalhando para sua imobiliária — por uma fração do salário. 7 dias grátis, cancela quando quiser.",
    monthly: "/mês",
    autonomous: "Corretor autônomo? Comece grátis com simulador + CRM + hotsite.",
    plans: [
      {
        name: "SMART",
        tagline: "Para imobiliárias em crescimento",
        price: "R$ 799",
        cta: "Testar 7 dias grátis",
        agents: ["BIA — chatbot IA + AI Learning", "DONNA — copiloto proativo para todos", "LINK — OLX, ZAP, VivaReal, Meta Leads"],
        features: ["CRM completo + Cockpit", "Kanban + property match", "Hotsite por empreendimento", "Simulador de financiamento", "Broadcaster WhatsApp"],
        quotas: ["Usuários ilimitados", "1.500 mensagens IA/mês", "300 créditos analíticos", "15.000 leads ativos"],
      },
      {
        name: "SCALE",
        tagline: "Para operações de alto volume",
        price: "R$ 1.499",
        cta: "Testar 7 dias grátis",
        highlight: "Mais popular",
        agents: ["Tudo do Smart +", "PIXEL — gestor de Meta Ads", "JOTA — BI & analytics"],
        features: ["CARTA — email marketing", "Automações e roleta de leads", "Pool de leads compartilhado", "Financeiro + comissões", "Omnichannel completo"],
        quotas: ["Usuários ilimitados", "3.000 mensagens IA/mês", "500 créditos analíticos", "50.000 leads ativos", "Suporte prioritário"],
      },
      {
        name: "SCALE PRO",
        tagline: "Escala máxima — usuários ilimitados",
        price: "R$ 2.999",
        cta: "Testar 7 dias grátis",
        agents: ["Tudo do Scale +", "BIA multi-WhatsApp simultâneo", "BRAIN — cérebro MCP exclusivo"],
        features: ["Multi-WhatsApp (até 3 números)", "Domínio personalizado", "BI avançado (cohort + score preditivo)", "Broadcasts ilimitados", "Overage automático"],
        quotas: ["Usuários ilimitados", "5.000 mensagens IA/mês", "1.500 créditos analíticos", "75.000 leads ativos", "Suporte 8h + chat"],
      },
    ],
    enterprise: {
      title: "Precisa de mais?",
      body: "Time dedicado, multi-WhatsApp, mentoria humana, integrações sob medida, CSM dedicado. Para redes, franquias e grandes operações.",
      cta: "Falar com um especialista",
    },
  },
  faq: {
    title: "Perguntas frequentes",
    items: [
      { q: "Quantos usuários posso ter? Pago por corretor?", a: "Usuários ilimitados em TODOS os planos — você nunca paga por corretor. Cadastre a equipe inteira: todos entram no CRM e todos usam a DONNA sem custo extra." },
      { q: "O que são as mensagens de IA?", a: "É o saldo mensal de conversas: cada resposta da BIA ou da DONNA consome 1 mensagem do mesmo pool. Use como preferir — mais BIA vendendo ou mais DONNA apoiando o time." },
      { q: "O SquadIA substitui meu CRM atual?", a: "Sim. CRM + atendimento + operação + marketing em um só lugar. E o principal: a IA atualiza o pipeline e o CRM sozinha." },
      { q: "Preciso do WhatsApp oficial (Meta Cloud API)?", a: "Sim, para estabilidade e escala. Rodamos sobre a API oficial do WhatsApp." },
      { q: "A BIA responde fora do horário comercial?", a: "Responde 24h, qualifica e move o lead para a próxima etapa automaticamente." },
      { q: "Posso publicar imóveis no OLX e VivaReal automaticamente?", a: "Sim. Geramos feed XML padrão VrSync e os leads dos portais entram no CRM com deduplicação e distribuição inteligente." },
      { q: "Consigo cancelar?", a: "Sim, a qualquer momento, conforme as regras do seu plano." },
    ],
  },
  trial: {
    title: "Comece seu teste grátis de 7 dias",
    subtitle: "Experimente todo o poder da IA na sua operação. Cancele quando quiser.",
    name: "Seu nome",
    company: "Nome da empresa",
    role: "Seu cargo",
    email: "Email",
    phone: "WhatsApp",
    submit: "Começar meu teste grátis",
    disclaimer: "7 dias grátis. Cancele quando quiser.",
    roles: ["Selecione…", "Sócio / Owner", "Diretor", "Gerente", "Coordenador", "Corretor", "Outro"],
    success: "Recebemos! Entraremos em contato pelo WhatsApp em minutos.",
    error: "Não conseguimos enviar. Tente novamente.",
  },
  footer: { rights: "Todos os direitos reservados.", contact: "Contato", product: "Produto", company: "Empresa" },
  common: { language: "Idioma" },
};

const en: Dict = {
  nav: { agent: "Agent", agency: "Agency", developer: "Developer", pricing: "Pricing", faq: "FAQ", login: "Sign in", trial: "Free trial" },
  hero: {
    eyebrow: "AI-first — like the big proptechs",
    title: "Hire an AI team that runs your operation 24/7.",
    subtitle: "The right technology. The right talent. More results with fewer resources.",
    bullet: "Unlimited users on every plan — you don't pay per agent.",
    body: "BIA answers WhatsApp leads in 30s. DONNA is a proactive copilot for every agent. PIXEL runs Meta Ads. JOTA delivers the numbers. LINK connects portals. Your agent only steps in to close.",
    cta: "Talk to BIA now",
    ctaGhost: "See the squad in action",
    trustA: "Meta Business Partner",
    trustB: "Official WhatsApp API",
  },
  agents: {
    title: "Every agent has a name and a job.",
    subtitle: "A full squad for the cost of one hire.",
    items: [
      { name: "BIA", role: "24/7 WhatsApp SDR", kpi: "< 30s", kpiLabel: "first response, 24/7" },
      { name: "DONNA", role: "Proactive agent copilot", kpi: "∞", kpiLabel: "for every user" },
      { name: "PIXEL", role: "Meta Ads manager", kpi: "−15 to −30%", kpiLabel: "CPL after 14 days" },
      { name: "JOTA", role: "BI analyst", kpi: "100%", kpiLabel: "of the funnel, real time" },
      { name: "LINK", role: "Portals connector", kpi: "99.5%+", kpiLabel: "paid leads captured" },
      { name: "CARTA", role: "Email marketing", kpi: "+20–30%", kpiLabel: "cold leads reactivated" },
      { name: "BRAIN", role: "Pro-exclusive brain", kpi: "MCP", kpiLabel: "actions across the CRM" },
    ],
  },
  cockpit: {
    title: "Your real-time cockpit.",
    subtitle: "From first click to signed contract — the whole funnel on one screen.",
    ownerLabel: "Owner Cockpit",
    date: "Global view · January 2026",
    tabs: ["Today", "7d", "Month"],
    stats: [
      { label: "Leads", value: "265", hint: "+12% vs last month" },
      { label: "Bookings", value: "98", hint: "37% conversion" },
      { label: "Approved", value: "39", hint: "Hot pipeline" },
      { label: "Sales", value: "14", hint: "Goal hit 🏆" },
    ],
    financials: "Current month",
    vgv: "GSV",
    vgc: "Comm.",
    roi: "ROI",
    bottlenecks: "Bottlenecks & alerts",
    goals: "Goals & copilot",
  },
  fronts: {
    title: "3 fronts that grow revenue and cut costs.",
    subtitle: "Your pipeline moves by itself. Your team focuses on what matters.",
    items: [
      {
        title: "Omnichannel response",
        body: "Every lead answered instantly, on any channel.",
        bullets: ["WhatsApp, Instagram, Facebook and TikTok in one flow", "AI replies and qualifies in natural language", "Smart follow-ups that win leads back"],
        punch: "⚡ Reply in seconds while competitors take hours.",
      },
      {
        title: "Predictable pipeline",
        body: "No-typing CRM: AI updates everything by itself.",
        bullets: ["Moves leads from first contact to sale", "Logs financing, objections and stages", "Bottleneck alerts (SLA, stalled analysis)"],
        punch: "⚡ Your team sells. Competitors are still typing.",
      },
      {
        title: "Marketing management",
        body: "Know where money turns into sales.",
        bullets: ["Cost per funnel stage, not per lead", "Which campaigns drive bookings and sales", "Less waste, more ROI"],
        punch: "⚡ Know where to invest before everyone else.",
      },
    ],
  },
  integrations: {
    title: "Integrations ready to scale.",
    subtitle: "We only show what's live in production. No empty promises.",
    live: "Live",
    loading: "Soon",
    items: [
      { name: "WhatsApp", kind: "Meta Cloud API", status: "live" },
      { name: "Instagram", kind: "Direct Messages", status: "live" },
      { name: "Facebook", kind: "Messenger", status: "live" },
      { name: "TikTok", kind: "Leads Ads", status: "loading" },
      { name: "Forms", kind: "Website & landing", status: "live" },
      { name: "OLX / ZAP", kind: "OLX Group", status: "live" },
      { name: "VivaReal", kind: "Portals", status: "live" },
      { name: "Meta Ads", kind: "CAPI + optimization", status: "live" },
    ],
  },
  pricing: {
    title: "Hire your AI team.",
    subtitle: "Each plan is a squad working for your agency — for a fraction of payroll. 7-day free trial, cancel anytime.",
    monthly: "/mo",
    autonomous: "Independent agent? Start free with simulator + CRM + hotsite.",
    plans: [
      {
        name: "SMART",
        tagline: "For growing agencies",
        price: "US$ 199",
        cta: "Start 7-day trial",
        agents: ["BIA — AI chatbot + AI Learning", "DONNA — proactive copilot for all", "LINK — OLX, ZAP, VivaReal, Meta Leads"],
        features: ["Full CRM + Cockpit", "Kanban + property match", "Hotsite per development", "Financing simulator", "WhatsApp broadcaster"],
        quotas: ["Unlimited users", "1,500 AI messages/mo", "300 analytical credits", "15,000 active leads"],
      },
      {
        name: "SCALE",
        tagline: "For high-volume operations",
        price: "US$ 399",
        cta: "Start 7-day trial",
        highlight: "Most popular",
        agents: ["Everything in Smart +", "PIXEL — Meta Ads manager", "JOTA — BI & analytics"],
        features: ["CARTA — email marketing", "Automations & lead round-robin", "Shared lead pool", "Finance + commissions", "Full omnichannel"],
        quotas: ["Unlimited users", "3,000 AI messages/mo", "500 analytical credits", "50,000 active leads", "Priority support"],
      },
      {
        name: "SCALE PRO",
        tagline: "Maximum scale — unlimited users",
        price: "US$ 899",
        cta: "Start 7-day trial",
        agents: ["Everything in Scale +", "BIA multi-WhatsApp", "BRAIN — exclusive MCP brain"],
        features: ["Multi-WhatsApp (up to 3)", "Custom domain", "Advanced BI (cohort + predictive)", "Unlimited broadcasts", "Automatic overage"],
        quotas: ["Unlimited users", "5,000 AI messages/mo", "1,500 analytical credits", "75,000 active leads", "8h priority + chat"],
      },
    ],
    enterprise: {
      title: "Need more?",
      body: "Dedicated team, multi-WhatsApp, human mentoring, custom integrations, dedicated CSM. For networks, franchises and large operations.",
      cta: "Talk to a specialist",
    },
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "How many users can I have? Do I pay per agent?", a: "Unlimited users on ALL plans — you never pay per agent. Sign up your whole team: everyone gets the CRM and everyone uses DONNA at no extra cost." },
      { q: "What are the AI messages?", a: "It's your monthly balance of AI conversations: every BIA or DONNA reply consumes 1 message from the same pool." },
      { q: "Does SquadIA replace my current CRM?", a: "Yes. CRM + response + operations + marketing in one place. And the AI updates the pipeline by itself." },
      { q: "Do I need official WhatsApp (Meta Cloud API)?", a: "Yes, for stability and scale. We run on the official WhatsApp API." },
      { q: "Does BIA respond outside business hours?", a: "Yes. 24/7 — it qualifies and moves the lead automatically." },
      { q: "Can I publish listings to OLX and VivaReal automatically?", a: "Yes. We generate a VrSync-standard XML feed and portal leads flow into the CRM with dedupe and smart distribution." },
      { q: "Can I cancel?", a: "Yes, anytime, according to your plan's rules." },
    ],
  },
  trial: {
    title: "Start your 7-day free trial",
    subtitle: "Feel the full power of AI in your operation. Cancel anytime.",
    name: "Your name",
    company: "Company name",
    role: "Your role",
    email: "Email",
    phone: "WhatsApp",
    submit: "Start my free trial",
    disclaimer: "7-day free trial. Cancel anytime.",
    roles: ["Select…", "Owner / Partner", "Director", "Manager", "Coordinator", "Agent", "Other"],
    success: "Got it! We'll reach out on WhatsApp shortly.",
    error: "Couldn't submit. Please try again.",
  },
  footer: { rights: "All rights reserved.", contact: "Contact", product: "Product", company: "Company" },
  common: { language: "Language" },
};

const es: Dict = {
  nav: { agent: "Corredor", agency: "Inmobiliaria", developer: "Constructor", pricing: "Planes", faq: "FAQ", login: "Entrar", trial: "Prueba gratis" },
  hero: {
    eyebrow: "AI-first — como las grandes proptechs",
    title: "Contrata un equipo de IA que opera tu inmobiliaria 24/7.",
    subtitle: "La tecnología correcta. El talento correcto. Más resultados con menos recursos.",
    bullet: "Usuarios ilimitados en todos los planes — no pagas por corredor.",
    body: "BIA responde leads en WhatsApp en 30s. DONNA es copiloto proactivo de cada corredor. PIXEL genera leads en Meta Ads. JOTA trae los números. LINK conecta portales. Tu corredor solo cierra.",
    cta: "Hablar con BIA ahora",
    ctaGhost: "Ver el squad en acción",
    trustA: "Meta Business Partner",
    trustB: "API oficial de WhatsApp",
  },
  agents: {
    title: "Cada agente con nombre y función.",
    subtitle: "Un squad completo por el costo de una contratación.",
    items: [
      { name: "BIA", role: "SDR 24/7 en WhatsApp", kpi: "< 30s", kpiLabel: "primera respuesta 24/7" },
      { name: "DONNA", role: "Copiloto proactivo", kpi: "∞", kpiLabel: "para todos los usuarios" },
      { name: "PIXEL", role: "Gestor de Meta Ads", kpi: "−15 a −30%", kpiLabel: "de CPL en 14 días" },
      { name: "JOTA", role: "Analista de BI", kpi: "100%", kpiLabel: "del embudo en tiempo real" },
      { name: "LINK", role: "Conector de portales", kpi: "99,5%+", kpiLabel: "leads captados" },
      { name: "CARTA", role: "Email marketing", kpi: "+20–30%", kpiLabel: "leads fríos reactivados" },
      { name: "BRAIN", role: "Cerebro exclusivo Pro", kpi: "MCP", kpiLabel: "acciones en todo el CRM" },
    ],
  },
  cockpit: {
    title: "Tu cockpit en tiempo real.",
    subtitle: "Del primer clic al contrato firmado — todo el embudo en una pantalla.",
    ownerLabel: "Cockpit del Owner",
    date: "Vista global · Enero 2026",
    tabs: ["Hoy", "7d", "Mes"],
    stats: [
      { label: "Leads", value: "265", hint: "+12% vs mes anterior" },
      { label: "Visitas", value: "98", hint: "37% de conversión" },
      { label: "Aprobados", value: "39", hint: "Pipeline caliente" },
      { label: "Ventas", value: "14", hint: "¡Meta alcanzada! 🏆" },
    ],
    financials: "Mes actual",
    vgv: "VGV",
    vgc: "Com.",
    roi: "ROI",
    bottlenecks: "Cuellos & alertas",
    goals: "Metas & copiloto",
  },
  fronts: {
    title: "3 frentes que crecen ingresos y cortan costos.",
    subtitle: "Tu pipeline se mueve solo. Tu equipo se enfoca en lo importante.",
    items: [
      {
        title: "Atención omnicanal",
        body: "Cada lead respondido al instante, en cualquier canal.",
        bullets: ["WhatsApp, Instagram, Facebook y TikTok en un solo flujo", "IA responde y califica en lenguaje natural", "Follow-ups inteligentes que recuperan leads"],
        punch: "⚡ Responde en segundos mientras la competencia demora horas.",
      },
      {
        title: "Pipeline predecible",
        body: "CRM sin digitación: la IA actualiza todo sola.",
        bullets: ["Mueve leads del primer contacto a la venta", "Registra financiamiento, objeciones y etapas", "Alertas de cuellos de botella"],
        punch: "⚡ Tu equipo vende. La competencia sigue tipeando.",
      },
      {
        title: "Gestión de marketing",
        body: "Sabe dónde el dinero se vuelve venta.",
        bullets: ["Costo por etapa del embudo, no solo por lead", "Qué campañas generan visitas y ventas", "Menos desperdicio, más ROI"],
        punch: "⚡ Sabe dónde invertir antes que todos.",
      },
    ],
  },
  integrations: {
    title: "Integraciones listas para escalar.",
    subtitle: "Solo mostramos lo que ya está en producción. Sin promesas vacías.",
    live: "En vivo",
    loading: "Pronto",
    items: [
      { name: "WhatsApp", kind: "Meta Cloud API", status: "live" },
      { name: "Instagram", kind: "Mensajes directos", status: "live" },
      { name: "Facebook", kind: "Messenger", status: "live" },
      { name: "TikTok", kind: "Leads Ads", status: "loading" },
      { name: "Formularios", kind: "Sitio & landing", status: "live" },
      { name: "OLX / ZAP", kind: "Grupo OLX", status: "live" },
      { name: "VivaReal", kind: "Portales", status: "live" },
      { name: "Meta Ads", kind: "CAPI + optimización", status: "live" },
    ],
  },
  pricing: {
    title: "Contrata tu equipo de IA.",
    subtitle: "Cada plan es un squad trabajando para tu inmobiliaria — por una fracción del salario. 7 días gratis, cancela cuando quieras.",
    monthly: "/mes",
    autonomous: "¿Corredor autónomo? Empieza gratis con simulador + CRM + hotsite.",
    plans: [
      {
        name: "SMART",
        tagline: "Para inmobiliarias en crecimiento",
        price: "US$ 199",
        cta: "Prueba 7 días gratis",
        agents: ["BIA — chatbot IA + AI Learning", "DONNA — copiloto proactivo", "LINK — OLX, ZAP, VivaReal, Meta"],
        features: ["CRM completo + Cockpit", "Kanban + property match", "Hotsite por proyecto", "Simulador financiero", "Broadcaster WhatsApp"],
        quotas: ["Usuarios ilimitados", "1.500 mensajes IA/mes", "300 créditos analíticos", "15.000 leads activos"],
      },
      {
        name: "SCALE",
        tagline: "Para operaciones de alto volumen",
        price: "US$ 399",
        cta: "Prueba 7 días gratis",
        highlight: "Más popular",
        agents: ["Todo Smart +", "PIXEL — gestor Meta Ads", "JOTA — BI & analytics"],
        features: ["CARTA — email marketing", "Automatizaciones + ruleta de leads", "Pool de leads compartido", "Finanzas + comisiones", "Omnicanal completo"],
        quotas: ["Usuarios ilimitados", "3.000 mensajes IA/mes", "500 créditos analíticos", "50.000 leads activos", "Soporte prioritario"],
      },
      {
        name: "SCALE PRO",
        tagline: "Escala máxima — usuarios ilimitados",
        price: "US$ 899",
        cta: "Prueba 7 días gratis",
        agents: ["Todo Scale +", "BIA multi-WhatsApp", "BRAIN — cerebro MCP exclusivo"],
        features: ["Multi-WhatsApp (hasta 3)", "Dominio personalizado", "BI avanzado (cohort + predictivo)", "Broadcasts ilimitados", "Overage automático"],
        quotas: ["Usuarios ilimitados", "5.000 mensajes IA/mes", "1.500 créditos analíticos", "75.000 leads activos", "Soporte 8h + chat"],
      },
    ],
    enterprise: {
      title: "¿Necesitas más?",
      body: "Equipo dedicado, multi-WhatsApp, mentoría humana, integraciones a medida, CSM dedicado. Para redes, franquicias y grandes operaciones.",
      cta: "Hablar con un especialista",
    },
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      { q: "¿Cuántos usuarios puedo tener? ¿Pago por corredor?", a: "Usuarios ilimitados en TODOS los planes. Registra a todo tu equipo: todos usan el CRM y DONNA sin costo extra." },
      { q: "¿Qué son los mensajes de IA?", a: "Es tu saldo mensual de conversaciones: cada respuesta de BIA o DONNA consume 1 mensaje del mismo pool." },
      { q: "¿SquadIA reemplaza mi CRM actual?", a: "Sí. CRM + atención + operación + marketing en un solo lugar. Y la IA actualiza el pipeline sola." },
      { q: "¿Necesito WhatsApp oficial (Meta Cloud API)?", a: "Sí, para estabilidad y escala. Corremos sobre la API oficial." },
      { q: "¿BIA responde fuera de horario?", a: "Sí. 24/7 — califica y mueve el lead automáticamente." },
      { q: "¿Puedo publicar en OLX y VivaReal automáticamente?", a: "Sí. Generamos feed XML VrSync y los leads entran al CRM con deduplicación." },
      { q: "¿Puedo cancelar?", a: "Sí, cuando quieras, según las reglas de tu plan." },
    ],
  },
  trial: {
    title: "Empieza tu prueba gratis de 7 días",
    subtitle: "Experimenta todo el poder de la IA. Cancela cuando quieras.",
    name: "Tu nombre",
    company: "Nombre de la empresa",
    role: "Tu cargo",
    email: "Email",
    phone: "WhatsApp",
    submit: "Empezar mi prueba gratis",
    disclaimer: "7 días gratis. Cancela cuando quieras.",
    roles: ["Selecciona…", "Socio / Owner", "Director", "Gerente", "Coordinador", "Corredor", "Otro"],
    success: "¡Recibido! Te contactamos por WhatsApp en minutos.",
    error: "No pudimos enviar. Intenta nuevamente.",
  },
  footer: { rights: "Todos los derechos reservados.", contact: "Contacto", product: "Producto", company: "Empresa" },
  common: { language: "Idioma" },
};

export const dict: Record<Locale, Dict> = { pt, en, es };
