import { createFileRoute } from "@tanstack/react-router";
import { LocaleProvider } from "@/lib/i18n";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Agents } from "@/components/landing/Agents";
import { Cockpit } from "@/components/landing/Cockpit";
import { Fronts } from "@/components/landing/Fronts";
import { Integrations } from "@/components/landing/Integrations";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { TrialForm } from "@/components/landing/TrialForm";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SquadIA — O time de IA que roda sua imobiliária 24/7" },
      { name: "description", content: "SquadIA é a plataforma AI-first para imobiliárias: BIA atende no WhatsApp em 30s, DONNA é copiloto do corretor, PIXEL gera leads no Meta Ads, JOTA entrega os números. Usuários ilimitados em todos os planos." },
      { property: "og:title", content: "SquadIA — O time de IA que roda sua imobiliária 24/7" },
      { property: "og:description", content: "AI-first para imobiliárias: atendimento omnichannel, CRM Kanban, pipeline previsível e ROI em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <LocaleProvider>
      <Header />
      <main>
        <Hero />
        <Agents />
        <Cockpit />
        <Fronts />
        <Integrations />
        <Pricing />
        <Faq />
        <TrialForm />
      </main>
      <Footer />
    </LocaleProvider>
  );
}
