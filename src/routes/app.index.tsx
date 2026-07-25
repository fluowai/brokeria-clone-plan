import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { crmStore, useLeads, STAGES } from "@/lib/crm-store";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SquadIA" },
      { name: "description", content: "Visão geral do seu funil de vendas e leads." },
      { property: "og:title", content: "Dashboard — SquadIA" },
      { property: "og:description", content: "Visão geral do seu funil." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) crmStore.seed(user.id);
  }, [user]);
  const leads = useLeads(user?.id);

  const total = leads.length;
  const closed = leads.filter((l) => l.stage === "fechado").length;
  const pipeline = leads.filter((l) => l.stage !== "fechado").reduce((s, l) => s + (l.budget || 0), 0);
  const conv = total ? Math.round((closed / total) * 100) : 0;

  const kpis = [
    { label: "Leads ativos", value: total },
    { label: "Fechados", value: closed },
    { label: "Pipeline", value: pipeline.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) },
    { label: "Conversão", value: `${conv}%` },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seu cockpit em tempo real.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 bg-card/60 border-border/60">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6 bg-card/60 border-border/60">
        <h2 className="text-lg font-semibold">Funil</h2>
        <div className="mt-4 space-y-3">
          {STAGES.map((s) => {
            const count = leads.filter((l) => l.stage === s.id).length;
            const pct = total ? (count / total) * 100 : 0;
            return (
              <div key={s.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
