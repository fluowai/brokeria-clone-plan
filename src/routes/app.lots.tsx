import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { lotsStore, useLots, STATUS_META, type Lot, type LotStatus } from "@/lib/lots-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/app/lots")({
  head: () => ({
    meta: [
      { title: "Mapa de Lotes — SquadIA" },
      { name: "description", content: "Gestão visual de lotes: reserve, venda e acompanhe o parcelamento." },
      { property: "og:title", content: "Mapa de Lotes — SquadIA" },
      { property: "og:description", content: "Controle o estoque de lotes do seu loteamento em tempo real." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <LotsPage />
      <Toaster />
    </AuthProvider>
  ),
});

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function LotsPage() {
  const { user } = useAuth();
  useEffect(() => { if (user) lotsStore.seed(user.id); }, [user]);
  const lots = useLots(user?.id);

  const [filter, setFilter] = useState<"all" | LotStatus>("all");
  const [selected, setSelected] = useState<Lot | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const parcelamentos = useMemo(() => Array.from(new Set(lots.map((l) => l.parcelamento))), [lots]);
  const [parcelamento, setParcelamento] = useState<string>("");
  useEffect(() => { if (!parcelamento && parcelamentos[0]) setParcelamento(parcelamentos[0]); }, [parcelamentos, parcelamento]);

  const visible = lots.filter((l) => (parcelamento ? l.parcelamento === parcelamento : true) && (filter === "all" || l.status === filter));

  const quadras = useMemo(() => Array.from(new Set(visible.map((l) => l.quadra))).sort(), [visible]);
  const maxLote = Math.max(8, ...visible.map((l) => Number(l.lote) || 0));

  const kpi = useMemo(() => {
    const total = visible.length;
    const disp = visible.filter((l) => l.status === "disponivel").length;
    const res = visible.filter((l) => l.status === "reservado").length;
    const vend = visible.filter((l) => l.status === "vendido" || l.status === "quitado").length;
    const vgv = visible.reduce((s, l) => s + l.precoAvista, 0);
    return { total, disp, res, vend, vgv };
  }, [visible]);

  function updateStatus(id: string, status: LotStatus) {
    lotsStore.update(id, { status });
    toast.success(`Lote atualizado para ${STATUS_META[status].label}`);
    setOpen(false);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa de Lotes</h1>
          <p className="text-sm text-muted-foreground">Controle visual do estoque do loteamento.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {parcelamentos.length > 0 && (
            <Select value={parcelamento} onValueChange={setParcelamento}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Loteamento" /></SelectTrigger>
              <SelectContent>
                {parcelamentos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => { setCreating(true); setOpen(true); setSelected(null); }}>Novo lote</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{kpi.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Disponíveis</div><div className="text-2xl font-semibold text-emerald-500">{kpi.disp}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Reservados</div><div className="text-2xl font-semibold text-amber-500">{kpi.res}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Vendidos</div><div className="text-2xl font-semibold text-sky-500">{kpi.vend}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">VGV estoque</div><div className="text-2xl font-semibold">{fmt(kpi.vgv)}</div></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "disponivel", "reservado", "vendido", "quitado"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs border transition ${filter === s ? "bg-primary/20 border-primary text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? "Todos" : STATUS_META[s].label}
          </button>
        ))}
      </div>

      <Card className="p-6 overflow-auto">
        {visible.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhum lote neste filtro. Cadastre o primeiro para começar.</div>
        ) : (
          <div className="space-y-4 min-w-max">
            {quadras.map((q) => (
              <div key={q} className="flex items-center gap-3">
                <div className="w-16 text-sm font-medium text-muted-foreground">Qd {q}</div>
                <div className="flex gap-2">
                  {Array.from({ length: maxLote }, (_, i) => i + 1).map((num) => {
                    const lote = visible.find((l) => l.quadra === q && Number(l.lote) === num);
                    if (!lote) return <div key={num} className="w-16 h-16 rounded-md border border-dashed border-border/40" />;
                    const meta = STATUS_META[lote.status];
                    return (
                      <button
                        key={lote.id}
                        onClick={() => { setSelected(lote); setCreating(false); setOpen(true); }}
                        className={`w-16 h-16 rounded-md border-2 ${meta.bg} hover:scale-105 transition text-left p-1.5 flex flex-col justify-between`}
                        title={`${lote.quadra}-${lote.lote} · ${meta.label} · ${fmt(lote.precoAvista)}`}
                      >
                        <div className="text-[10px] font-medium">{lote.quadra}{lote.lote}</div>
                        <div className={`text-[9px] ${meta.color} truncate`}>{lote.areaM2}m²</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          {(Object.keys(STATUS_META) as LotStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded ${STATUS_META[s].bg} border-2`} />
              <span className="text-muted-foreground">{STATUS_META[s].label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{creating ? "Novo lote" : selected ? `Lote ${selected.quadra}-${selected.lote}` : "Lote"}</DialogTitle>
          </DialogHeader>
          {creating ? (
            <NewLotForm
              defaultParcelamento={parcelamento || "Residencial Alvorada"}
              onSave={(l) => { if (user) { lotsStore.add({ ...l, ownerId: user.id }); toast.success("Lote adicionado"); setOpen(false); } }}
            />
          ) : selected ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Loteamento" value={selected.parcelamento} />
                <Info label="Status" value={STATUS_META[selected.status].label} />
                <Info label="Área" value={`${selected.areaM2} m²`} />
                <Info label="Frente" value={selected.frenteM ? `${selected.frenteM} m` : "—"} />
                <Info label="À vista" value={fmt(selected.precoAvista)} />
                <Info label="Parcelado" value={selected.precoParcelado ? `${fmt(selected.entrada || 0)} + ${selected.parcelas}x` : "—"} />
              </div>
              {selected.clienteNome && <Info label="Cliente" value={selected.clienteNome} />}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                {(Object.keys(STATUS_META) as LotStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={selected.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateStatus(selected.id, s)}
                  >
                    {STATUS_META[s].label}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="destructive" size="sm" onClick={() => { lotsStore.remove(selected.id); toast.success("Lote removido"); setOpen(false); }}>Excluir</Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function NewLotForm({ defaultParcelamento, onSave }: { defaultParcelamento: string; onSave: (l: Omit<Lot, "id" | "createdAt" | "ownerId">) => void }) {
  const [f, setF] = useState({
    parcelamento: defaultParcelamento, quadra: "A", lote: "01",
    areaM2: 300, frenteM: 12, precoAvista: 120000, precoParcelado: 150000, entrada: 15000, parcelas: 120,
    status: "disponivel" as LotStatus, x: 0, y: 0,
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => { e.preventDefault(); onSave(f); }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Loteamento"><Input value={f.parcelamento} onChange={(e) => setF({ ...f, parcelamento: e.target.value })} required /></Field>
        <Field label="Status">
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as LotStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_META) as LotStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Quadra"><Input value={f.quadra} onChange={(e) => setF({ ...f, quadra: e.target.value.toUpperCase() })} required /></Field>
        <Field label="Lote"><Input value={f.lote} onChange={(e) => setF({ ...f, lote: e.target.value })} required /></Field>
        <Field label="Área (m²)"><Input type="number" value={f.areaM2} onChange={(e) => setF({ ...f, areaM2: Number(e.target.value) })} /></Field>
        <Field label="Frente (m)"><Input type="number" value={f.frenteM} onChange={(e) => setF({ ...f, frenteM: Number(e.target.value) })} /></Field>
        <Field label="À vista (R$)"><Input type="number" value={f.precoAvista} onChange={(e) => setF({ ...f, precoAvista: Number(e.target.value) })} /></Field>
        <Field label="Parcelado (R$)"><Input type="number" value={f.precoParcelado} onChange={(e) => setF({ ...f, precoParcelado: Number(e.target.value) })} /></Field>
        <Field label="Entrada (R$)"><Input type="number" value={f.entrada} onChange={(e) => setF({ ...f, entrada: Number(e.target.value) })} /></Field>
        <Field label="Parcelas"><Input type="number" value={f.parcelas} onChange={(e) => setF({ ...f, parcelas: Number(e.target.value) })} /></Field>
      </div>
      <Button type="submit" className="w-full">Cadastrar lote</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
