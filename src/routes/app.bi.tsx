import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuthProvider, useAuth } from "@/lib/auth";
import { crmStore, useLeads, STAGES } from "@/lib/crm-store";
import { useProperties } from "@/lib/property-store";
import { getMetaAdsSummary, type AdsSummary } from "@/lib/meta-ads.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/bi")({
  head: () => ({
    meta: [
      { title: "BI Cockpit — SquadIA" },
      { name: "description", content: "Business Intelligence unificado: CRM, imóveis e Meta Ads." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <BIPage />
    </AuthProvider>
  ),
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("pt-BR");

function BIPage() {
  const { user } = useAuth();
  useEffect(() => { if (user) crmStore.seed(user.id); }, [user]);
  const leads = useLeads(user?.id);
  const properties = useProperties(user?.id);
  const fetchAds = useServerFn(getMetaAdsSummary);
  const [ads, setAds] = useState<AdsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAds()
      .then(setAds)
      .catch(() => setAds(null))
      .finally(() => setLoading(false));
  }, [fetchAds]);

  const closed = leads.filter((l) => l.stage === "fechado").length;
  const pipeline = leads.filter((l) => l.stage !== "fechado").reduce((s, l) => s + (l.budget || 0), 0);
  const gmv = leads.filter((l) => l.stage === "fechado").reduce((s, l) => s + (l.budget || 0), 0);
  const conv = leads.length ? Math.round((closed / leads.length) * 100) : 0;
  const roas = ads && ads.totals.spend > 0 ? gmv / ads.totals.spend : 0;

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">BI Cockpit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ads?.since} → {ads?.until} · unificado com CRM e portfólio.
          </p>
        </div>
        {ads && (
          <Badge variant={ads.configured ? "default" : "outline"}>
            {ads.configured ? "Meta Ads conectado" : "Meta Ads simulado"}
          </Badge>
        )}
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Investido (30d)" value={ads ? brl(ads.totals.spend) : "—"} />
        <KPI label="Leads Ads" value={ads ? num(ads.totals.leads) : "—"} />
        <KPI label="CPL" value={ads ? brl(ads.totals.cpl) : "—"} />
        <KPI label="ROAS estimado" value={roas ? `${roas.toFixed(2)}x` : "—"} accent />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Leads no CRM" value={num(leads.length)} />
        <KPI label="Conversão" value={`${conv}%`} />
        <KPI label="Pipeline em aberto" value={brl(pipeline)} />
        <KPI label="Imóveis ativos" value={num(properties.length)} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 bg-card/60">
          <h2 className="font-medium mb-4">Campanhas Meta Ads</h2>
          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {ads && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase">
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2">Campanha</th>
                    <th className="text-right">Gasto</th>
                    <th className="text-right">Impr.</th>
                    <th className="text-right">Cliques</th>
                    <th className="text-right">CTR</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.campaigns.map((c) => (
                    <tr key={c.campaign} className="border-b border-border/40">
                      <td className="py-2">
                        <div className="font-medium">{c.campaign}</div>
                        <div className="text-xs text-muted-foreground">{c.status}</div>
                      </td>
                      <td className="text-right">{brl(c.spend)}</td>
                      <td className="text-right">{num(c.impressions)}</td>
                      <td className="text-right">{num(c.clicks)}</td>
                      <td className="text-right">{c.ctr.toFixed(2)}%</td>
                      <td className="text-right font-medium">{num(c.leads)}</td>
                      <td className="text-right">{c.leads ? brl(c.spend / c.leads) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ads?.error && (
            <p className="text-xs text-muted-foreground mt-3">
              {ads.error} Defina <code>META_ADS_ACCESS_TOKEN</code> e <code>META_ADS_ACCOUNT_ID</code> para dados reais.
            </p>
          )}
        </Card>

        <Card className="p-5 bg-card/60">
          <h2 className="font-medium mb-4">Funil CRM</h2>
          <div className="space-y-3">
            {STAGES.map((s) => {
              const count = leads.filter((l) => l.stage === s.id).length;
              const pct = leads.length ? (count / leads.length) * 100 : 0;
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
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={`p-5 ${accent ? "bg-primary/10 border-primary/40" : "bg-card/60 border-border/60"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </Card>
  );
}
