import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { crmStore, useLeads, STAGES, type Lead, type LeadStage } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/app/crm")({
  head: () => ({
    meta: [
      { title: "CRM — SquadIA" },
      { name: "description", content: "Pipeline Kanban com arrastar-e-soltar para gerenciar seus leads." },
      { property: "og:title", content: "CRM — SquadIA" },
      { property: "og:description", content: "Kanban de leads em tempo real." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <CRMPage />
      <Toaster />
    </AuthProvider>
  ),
});

function CRMPage() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) crmStore.seed(user.id);
  }, [user]);
  const leads = useLeads(user?.id);
  const [dragId, setDragId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const onDrop = (stage: LeadStage) => {
    if (dragId) {
      crmStore.move(dragId, stage);
      setDragId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM Kanban</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arraste os cards entre colunas para atualizar o estágio.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Novo lead</Button>
          </DialogTrigger>
          <NewLeadDialog ownerId={user!.id} onDone={() => setOpen(false)} />
        </Dialog>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAGES.map((s) => {
          const items = leads.filter((l) => l.stage === s.id);
          return (
            <div
              key={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(s.id)}
              className="rounded-xl border border-border/60 bg-card/40 p-3 min-h-[300px]"
            >
              <div className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${s.color}`}>
                {s.label} · {items.length}
              </div>
              <div className="mt-3 space-y-2">
                {items.map((l) => (
                  <LeadCard key={l.id} lead={l} onDragStart={() => setDragId(l.id)} />
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-muted-foreground/60 py-8 text-center">Solte um lead aqui</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead, onDragStart }: { lead: Lead; onDragStart: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card
        draggable
        onDragStart={onDragStart}
        onClick={() => setOpen(true)}
        className="p-3 cursor-grab active:cursor-grabbing bg-background/60 hover:border-primary/50 transition"
      >
        <div className="font-medium text-sm">{lead.name}</div>
        <div className="mt-1 text-xs text-muted-foreground truncate">{lead.interest}</div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{lead.source}</span>
          {lead.budget && (
            <span className="text-primary font-medium">
              {lead.budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <LeadDetailDialog lead={lead} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function NewLeadDialog({ ownerId, onDone }: { ownerId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("WhatsApp");
  const [interest, setInterest] = useState("");
  const [budget, setBudget] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    crmStore.add({
      name,
      phone,
      email,
      source,
      interest,
      budget: budget ? Number(budget) : undefined,
      stage: "novo",
      ownerId,
    });
    toast.success("Lead criado");
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo lead</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Origem</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["WhatsApp", "Meta Ads", "Site", "OLX", "ZAP", "Indicação"].map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Orçamento (R$)</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Interesse</Label>
          <Textarea value={interest} onChange={(e) => setInterest(e.target.value)} rows={2} required />
        </div>
        <Button type="submit" className="w-full">Criar lead</Button>
      </form>
    </DialogContent>
  );
}

function LeadDetailDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [notes, setNotes] = useState(lead.notes || "");
  const save = () => {
    crmStore.update(lead.id, { notes });
    toast.success("Salvo");
    onClose();
  };
  const remove = () => {
    crmStore.remove(lead.id);
    toast.success("Lead removido");
    onClose();
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{lead.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Telefone:</span> {lead.phone || "—"}</div>
        <div><span className="text-muted-foreground">Email:</span> {lead.email || "—"}</div>
        <div><span className="text-muted-foreground">Origem:</span> {lead.source}</div>
        <div><span className="text-muted-foreground">Interesse:</span> {lead.interest}</div>
        {lead.budget && (
          <div><span className="text-muted-foreground">Orçamento:</span> {lead.budget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        )}
        <div className="pt-2">
          <Label>Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={remove} className="text-destructive hover:text-destructive">Excluir</Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </div>
    </DialogContent>
  );
}
