import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { developmentsStore, useDevelopments, UNIT_STATUS_META, type Development, type Unit, type UnitStatus } from "@/lib/developments-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/app/developments")({
  head: () => ({
    meta: [
      { title: "Empreendimentos — SquadIA" },
      { name: "description", content: "Gestão de empreendimentos com espelho de vendas por torre e unidade." },
      { property: "og:title", content: "Empreendimentos — SquadIA" },
      { property: "og:description", content: "Espelho de vendas, VGV, evolução da obra e reservas." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <DevelopmentsPage />
      <Toaster />
    </AuthProvider>
  ),
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function DevelopmentsPage() {
  const { user } = useAuth();
  useEffect(() => { if (user) developmentsStore.seed(user.id); }, [user]);
  const items = useDevelopments(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = items.find((d) => d.id === selectedId) ?? items[0];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empreendimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Espelho de vendas por torre, com VGV e evolução da obra.</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>+ Novo empreendimento</Button></DialogTrigger>
          <DevelopmentForm onSubmit={(d) => {
            developmentsStore.add({ ...d, ownerId: user!.id });
            toast.success("Empreendimento criado");
            setCreating(false);
          }} />
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="mt-8 p-12 text-center bg-card/40 border-dashed">
          <p className="text-muted-foreground">Nenhum empreendimento cadastrado.</p>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2">
            {items.map((d) => {
              const vendidas = d.units.filter((u) => u.status === "vendido" || u.status === "quitado").length;
              const active = selected?.id === d.id;
              return (
                <button key={d.id} onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left rounded-md border p-3 transition ${active ? "border-primary bg-primary/10" : "border-border/60 bg-card/40 hover:border-primary/40"}`}>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{d.city}/{d.state} · {d.status}</div>
                  <div className="text-xs mt-2">{vendidas}/{d.unidadesTotal} un · obra {d.obraPercent}%</div>
                </button>
              );
            })}
          </div>

          {selected && <DevelopmentDetail dev={selected} />}
        </div>
      )}
    </div>
  );
}

function DevelopmentDetail({ dev }: { dev: Development }) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const kpis = useMemo(() => {
    const total = dev.units.length;
    const vendidas = dev.units.filter((u) => u.status === "vendido" || u.status === "quitado").length;
    const reservadas = dev.units.filter((u) => u.status === "reservado").length;
    const disponivel = dev.units.filter((u) => u.status === "disponivel").length;
    const vgvRealizado = dev.units.filter((u) => u.status === "vendido" || u.status === "quitado").reduce((a, u) => a + u.precoTabela, 0);
    const vgvTotal = dev.units.reduce((a, u) => a + u.precoTabela, 0);
    return { total, vendidas, reservadas, disponivel, vgvRealizado, vgvTotal, pctVendido: total ? Math.round((vendidas / total) * 100) : 0 };
  }, [dev]);

  const torres = useMemo(() => Array.from(new Set(dev.units.map((u) => u.torre))).sort(), [dev]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="VGV Total" value={brl(kpis.vgvTotal)} />
        <Kpi label="VGV Realizado" value={brl(kpis.vgvRealizado)} accent />
        <Kpi label="Vendas" value={`${kpis.vendidas}/${kpis.total} (${kpis.pctVendido}%)`} />
        <Kpi label="Obra" value={`${dev.obraPercent}%`} />
      </div>

      <Card className="p-4 bg-card/40 border-border/60">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Evolução da obra</div>
            <div className="text-sm">Previsão de entrega: {dev.previsaoEntrega || "—"}</div>
          </div>
          <div className="text-sm text-muted-foreground">Stand: {dev.standEndereco || "—"}</div>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${dev.obraPercent}%` }} />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.entries(UNIT_STATUS_META) as [UnitStatus, typeof UNIT_STATUS_META.disponivel][]).map(([k, m]) => (
          <div key={k} className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded border ${m.bg}`} />
            <span className="text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>

      {torres.map((torre) => {
        const unitsT = dev.units.filter((u) => u.torre === torre);
        const andares = Array.from(new Set(unitsT.map((u) => u.andar))).sort((a, b) => b - a);
        return (
          <Card key={torre} className="p-4 bg-card/40 border-border/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Torre {torre}</h3>
              <span className="text-xs text-muted-foreground">{unitsT.length} unidades</span>
            </div>
            <div className="space-y-1">
              {andares.map((andar) => {
                const row = unitsT.filter((u) => u.andar === andar).sort((a, b) => a.numero.localeCompare(b.numero));
                return (
                  <div key={andar} className="flex items-center gap-2">
                    <div className="w-10 text-xs text-muted-foreground">{andar}º</div>
                    <div className="flex gap-1 flex-wrap">
                      {row.map((u) => {
                        const m = UNIT_STATUS_META[u.status];
                        return (
                          <button key={u.id} onClick={() => setSelectedUnit(u)}
                            className={`w-14 h-10 rounded border text-xs font-medium ${m.bg} ${m.text} hover:scale-105 transition-transform`}
                            title={`${u.numero} · ${u.tipologia} · ${brl(u.precoTabela)}`}>
                            {u.numero}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <Dialog open={!!selectedUnit} onOpenChange={(o) => !o && setSelectedUnit(null)}>
        {selectedUnit && (
          <UnitDialog unit={selectedUnit} onChange={(status, clienteNome) => {
            developmentsStore.setUnitStatus(dev.id, selectedUnit.id, status, clienteNome);
            toast.success("Status atualizado");
            setSelectedUnit(null);
          }} />
        )}
      </Dialog>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4 bg-card/40 border-border/60">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </Card>
  );
}

function UnitDialog({ unit, onChange }: { unit: Unit; onChange: (status: UnitStatus, clienteNome?: string) => void }) {
  const [status, setStatus] = useState<UnitStatus>(unit.status);
  const [cliente, setCliente] = useState(unit.clienteNome ?? "");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Unidade {unit.torre} · {unit.numero}</DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Tipologia</Label><div className="mt-1">{unit.tipologia}</div></div>
          <div><Label>Área</Label><div className="mt-1">{unit.areaM2} m²</div></div>
          <div><Label>Dormitórios</Label><div className="mt-1">{unit.bedrooms}</div></div>
          <div><Label>Preço tabela</Label><div className="mt-1 text-primary">{brl(unit.precoTabela)}</div></div>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as UnitStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(UNIT_STATUS_META) as [UnitStatus, typeof UNIT_STATUS_META.disponivel][]).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cliente</Label>
          <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do comprador (opcional)" />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onChange(status, cliente || undefined)}>Salvar</Button>
        </div>
      </div>
    </DialogContent>
  );
}

function DevelopmentForm({ onSubmit }: { onSubmit: (d: Omit<Development, "id" | "createdAt" | "units" | "ownerId">) => void }) {
  const [form, setForm] = useState({
    name: "", status: "lancamento" as Development["status"], previsaoEntrega: "",
    vgv: 0, torres: 1, unidadesTotal: 40, obraPercent: 0,
    memorial: "", tour360Url: "", standEndereco: "", city: "", state: "", coverUrl: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Novo empreendimento</DialogTitle></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
        <div><Label>Nome</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as Development["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lancamento">Lançamento</SelectItem>
                <SelectItem value="obras">Em obras</SelectItem>
                <SelectItem value="pronto">Pronto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Previsão de entrega</Label><Input type="month" value={form.previsaoEntrega} onChange={(e) => set("previsaoEntrega", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Torres</Label><Input type="number" min={1} value={form.torres} onChange={(e) => set("torres", Number(e.target.value))} /></div>
          <div><Label>Unidades total</Label><Input type="number" value={form.unidadesTotal} onChange={(e) => set("unidadesTotal", Number(e.target.value))} /></div>
          <div><Label>Obra (%)</Label><Input type="number" min={0} max={100} value={form.obraPercent} onChange={(e) => set("obraPercent", Number(e.target.value))} /></div>
        </div>
        <div><Label>VGV (R$)</Label><Input type="number" value={form.vgv} onChange={(e) => set("vgv", Number(e.target.value))} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div><Label>Estado</Label><Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} /></div>
        </div>
        <div><Label>Endereço do stand</Label><Input value={form.standEndereco} onChange={(e) => set("standEndereco", e.target.value)} /></div>
        <div><Label>Tour 360 URL</Label><Input value={form.tour360Url} onChange={(e) => set("tour360Url", e.target.value)} placeholder="https://..." /></div>
        <div><Label>Memorial descritivo</Label><Textarea rows={3} value={form.memorial} onChange={(e) => set("memorial", e.target.value)} /></div>
        <div className="flex justify-end pt-2"><Button type="submit">Criar</Button></div>
      </form>
    </DialogContent>
  );
}
