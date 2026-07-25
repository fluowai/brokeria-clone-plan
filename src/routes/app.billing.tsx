import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { plansFor, planById, useBilling, billingStore, computeUsage, type PlanId } from "@/lib/billing-store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useProperties } from "@/lib/property-store";
import { useDevelopments } from "@/lib/developments-store";
import { useLots } from "@/lib/lots-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Zap, CreditCard, Sparkles, AlertTriangle } from "lucide-react";
import type { Vertical } from "@/lib/property-store";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "Planos & Créditos — SquadIA" },
      { name: "description", content: "Planos por segmento (urbano, rural, incorporadora, loteadora) e créditos IA." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <BillingPage />
    </AuthProvider>
  ),
});

function BillingPage() {
  const { user } = useAuth();
  const vertical = (user?.tenant?.vertical ?? "urban") as Vertical;
  const billing = useBilling();
  const [checkout, setCheckout] = useState<PlanId | null>(null);

  const properties = useProperties(user?.id);
  const developments = useDevelopments(user?.id);
  const lots = useLots(user?.id);

  const plans = plansFor(vertical);
  const currentPlan = billing.planId ? planById(billing.planId) : null;
  const trialDays = billing.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const unitsCount = useMemo(() => {
    if (vertical === "developer") return developments.reduce((s, d) => s + d.units.length, 0);
    if (vertical === "land") return lots.length;
    return properties.length;
  }, [vertical, properties.length, developments, lots.length]);

  const usage = computeUsage({
    planId: billing.planId,
    vertical,
    users: 1,
    units: unitsCount,
    whatsappNumbers: 1,
  });

  const unitLabel = vertical === "developer" ? "Unidades" : vertical === "land" ? "Lotes" : vertical === "rural" ? "Propriedades" : "Imóveis";

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Planos & Créditos</h1>
          <p className="text-muted-foreground mt-1">
            Planos calibrados para <span className="text-primary capitalize">{vertical}</span>.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><CreditCard className="h-4 w-4" /> Plano atual</div>
          <div className="mt-2 text-2xl font-semibold">{currentPlan?.name ?? "Trial"}</div>
          <div className="mt-1">
            <Badge variant={billing.status === "active" ? "default" : billing.status === "trial" ? "secondary" : "destructive"}>
              {billing.status === "active" ? "Ativo" : billing.status === "trial" ? `Trial · ${trialDays}d` : "Cancelado"}
            </Badge>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Zap className="h-4 w-4" /> Créditos IA</div>
          <div className="mt-2 text-2xl font-semibold">{billing.credits.toLocaleString("pt-BR")}</div>
          <div className="mt-1 text-xs text-muted-foreground">Consumidos por chat IA e WhatsApp</div>
        </Card>
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Sparkles className="h-4 w-4" /> Turbinar</div>
            <div className="mt-2 text-sm">+500 créditos por R$ 49</div>
          </div>
          <Button size="sm" className="mt-4" onClick={() => { billingStore.addCredits(500); toast.success("+500 créditos"); }}>
            Comprar pacote
          </Button>
        </Card>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Uso do plano</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <UsageCard label={unitLabel} used={usage.units.used} limit={usage.units.limit} pct={usage.units.pct} over={usage.units.over} />
          <UsageCard label="Usuários" used={usage.users.used} limit={usage.users.limit} pct={usage.users.pct} over={usage.users.over} />
          <UsageCard label="Números WhatsApp" used={usage.whatsapp.used} limit={usage.whatsapp.limit} pct={usage.whatsapp.pct} over={usage.whatsapp.over} />
        </div>
        {(usage.units.over || usage.users.over || usage.whatsapp.over) && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div>Você ultrapassou um dos limites do plano. Faça upgrade para continuar cadastrando.</div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Planos para {vertical}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = p.id === billing.planId && billing.status === "active";
            return (
              <Card key={p.id} className={`p-6 flex flex-col ${p.highlight ? "border-primary/60 ring-1 ring-primary/30" : ""}`}>
                {p.highlight && <Badge className="w-fit mb-3">Mais popular</Badge>}
                <div className="text-lg font-semibold">{p.name.split(" · ")[0]}</div>
                <div className="mt-2 text-3xl font-bold">
                  R$ {p.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <div>{fmtLimit(p.limits.units)} {unitLabel.toLowerCase()}</div>
                  <div>{fmtLimit(p.limits.users)} usuários · {fmtLimit(p.limits.whatsappNumbers)} WhatsApp</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" variant={p.highlight ? "default" : "outline"} disabled={isCurrent} onClick={() => setCheckout(p.id)}>
                  {isCurrent ? "Plano atual" : "Assinar"}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Histórico de faturas</h2>
        <Card className="overflow-hidden">
          {billing.history.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhuma fatura ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr><th className="p-3">Data</th><th className="p-3">Plano</th><th className="p-3">Valor</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {billing.history.map((h) => (
                  <tr key={h.id} className="border-t border-border/60">
                    <td className="p-3">{new Date(h.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3">{planById(h.planId)?.name ?? h.planId}</td>
                    <td className="p-3">R$ {h.amount}</td>
                    <td className="p-3"><Badge variant={h.status === "paid" ? "default" : "secondary"}>{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        {billing.status === "active" && (
          <Button variant="ghost" size="sm" className="mt-4 text-destructive" onClick={() => { billingStore.cancel(); toast.success("Assinatura cancelada"); }}>
            Cancelar assinatura
          </Button>
        )}
      </section>

      <CheckoutDialog planId={checkout} onClose={() => setCheckout(null)} />
    </div>
  );
}

function fmtLimit(n: number) {
  return n === -1 ? "Ilimitado" : `Até ${n}`;
}

function UsageCard({ label, used, limit, pct, over }: { label: string; used: number; limit: number; pct: number; over: boolean }) {
  return (
    <Card className="p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <div className="text-2xl font-semibold">{used}</div>
        <div className="text-xs text-muted-foreground">/ {limit === -1 ? "∞" : limit}</div>
      </div>
      <Progress value={pct} className={`mt-3 h-2 ${over ? "[&>div]:bg-destructive" : ""}`} />
    </Card>
  );
}

function CheckoutDialog({ planId, onClose }: { planId: PlanId | null; onClose: () => void }) {
  const plan = planId ? planById(planId) : null;
  const [processing, setProcessing] = useState(false);

  const confirm = async () => {
    if (!plan) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 800));
    billingStore.subscribeToPlan(plan.id);
    setProcessing(false);
    toast.success(`${plan.name} ativado! +${plan.credits} créditos.`);
    onClose();
  };

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout — {plan?.name}</DialogTitle>
          <DialogDescription>Simulação. Em produção, integre Stripe/Paddle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Row label="Plano" value={plan?.name ?? ""} />
          <Row label="Créditos IA inclusos" value={plan?.credits.toLocaleString("pt-BR") ?? "0"} />
          <Row label={`Limite de ${plan?.vertical === "developer" ? "unidades" : plan?.vertical === "land" ? "lotes" : "imóveis"}`} value={fmtLimit(plan?.limits.units ?? 0)} />
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Total hoje</span><span>R$ {plan?.price}</span>
          </div>
          <div className="grid gap-2 pt-2">
            <Label htmlFor="card">Cartão (mock)</Label>
            <Input id="card" placeholder="4242 4242 4242 4242" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={processing}>Cancelar</Button>
          <Button onClick={confirm} disabled={processing}>{processing ? "Processando..." : `Pagar R$ ${plan?.price}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>;
}
