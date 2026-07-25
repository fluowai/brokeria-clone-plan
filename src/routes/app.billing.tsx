import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PLANS, useBilling, billingStore, type PlanId } from "@/lib/billing-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Zap, CreditCard, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "Planos & Créditos — SquadIA" },
      { name: "description", content: "Gerencie sua assinatura e créditos IA." },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const billing = useBilling();
  const [checkout, setCheckout] = useState<PlanId | null>(null);

  const currentPlan = PLANS.find((p) => p.id === billing.planId);
  const trialDays = billing.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Planos & Créditos</h1>
        <p className="text-muted-foreground mt-1">Assine e recarregue créditos para IA, WhatsApp e automações.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CreditCard className="h-4 w-4" /> Plano atual
          </div>
          <div className="mt-2 text-2xl font-semibold">{currentPlan?.name ?? "Trial"}</div>
          <div className="mt-1">
            <Badge variant={billing.status === "active" ? "default" : billing.status === "trial" ? "secondary" : "destructive"}>
              {billing.status === "active" ? "Ativo" : billing.status === "trial" ? `Trial · ${trialDays}d` : "Cancelado"}
            </Badge>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Zap className="h-4 w-4" /> Créditos IA
          </div>
          <div className="mt-2 text-2xl font-semibold">{billing.credits.toLocaleString("pt-BR")}</div>
          <div className="mt-1 text-xs text-muted-foreground">Consumidos por chat IA e WhatsApp</div>
        </Card>
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4" /> Turbinar
            </div>
            <div className="mt-2 text-sm">+500 créditos por R$ 49</div>
          </div>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => {
              billingStore.addCredits(500);
              billingStore.get().history.unshift({
                id: `inv_${Date.now()}`,
                date: new Date().toISOString(),
                planId: (billing.planId ?? "starter") as PlanId,
                amount: 49,
                status: "paid",
              });
              toast.success("+500 créditos adicionados");
            }}
          >
            Comprar pacote
          </Button>
        </Card>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Escolha um plano</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === billing.planId && billing.status === "active";
            return (
              <Card
                key={p.id}
                className={`p-6 flex flex-col ${p.highlight ? "border-primary/60 ring-1 ring-primary/30" : ""}`}
              >
                {p.highlight && <Badge className="w-fit mb-3">Mais popular</Badge>}
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="mt-2 text-3xl font-bold">
                  R$ {p.price}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6"
                  variant={p.highlight ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => setCheckout(p.id)}
                >
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
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.history.map((h) => (
                  <tr key={h.id} className="border-t border-border/60">
                    <td className="p-3">{new Date(h.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 capitalize">{h.planId}</td>
                    <td className="p-3">R$ {h.amount}</td>
                    <td className="p-3">
                      <Badge variant={h.status === "paid" ? "default" : "secondary"}>{h.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        {billing.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-destructive"
            onClick={() => {
              billingStore.cancel();
              toast.success("Assinatura cancelada");
            }}
          >
            Cancelar assinatura
          </Button>
        )}
      </section>

      <CheckoutDialog planId={checkout} onClose={() => setCheckout(null)} />
    </div>
  );
}

function CheckoutDialog({ planId, onClose }: { planId: PlanId | null; onClose: () => void }) {
  const plan = PLANS.find((p) => p.id === planId);
  const [processing, setProcessing] = useState(false);

  const confirm = async () => {
    if (!plan) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 900));
    billingStore.subscribeToPlan(plan.id);
    setProcessing(false);
    toast.success(`Plano ${plan.name} ativado! +${plan.credits} créditos.`);
    onClose();
  };

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Checkout — {plan?.name}</DialogTitle>
          <DialogDescription>
            Simulação de pagamento. Em produção, integre Stripe/Paddle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Plano {plan?.name}</span>
            <span>R$ {plan?.price}/mês</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Créditos IA inclusos</span>
            <span>{plan?.credits.toLocaleString("pt-BR")}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Total hoje</span>
            <span>R$ {plan?.price}</span>
          </div>
          <div className="grid gap-2 pt-2">
            <Label htmlFor="card">Cartão (mock)</Label>
            <Input id="card" placeholder="4242 4242 4242 4242" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={processing}>
            {processing ? "Processando..." : `Pagar R$ ${plan?.price}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
