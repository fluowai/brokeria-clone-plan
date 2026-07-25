import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useContracts,
  createContract,
  markInstallment,
  setContractStatus,
  deleteContract,
  refreshLateStatuses,
  contractKpis,
  type Contract,
  type InstallmentStatus,
} from "@/lib/contracts-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, DollarSign, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/contracts")({
  head: () => ({
    meta: [
      { title: "Contratos — SquadIA" },
      { name: "description", content: "Gestão de contratos e régua de cobrança de parcelas." },
    ],
  }),
  component: ContractsPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR");

function ContractsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  const contracts = useContracts(tenantId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);

  useEffect(() => {
    refreshLateStatuses();
  }, []);

  const kpis = useMemo(() => contractKpis(contracts), [contracts]);

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Espelho de contratos, parcelas e régua de cobrança.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Novo contrato</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={<FileText className="h-4 w-4" />} label="Contratos ativos" value={String(kpis.ativos)} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="VGV contratado" value={brl(kpis.vgv)} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Recebido" value={brl(kpis.recebido)} />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Inadimplência" value={brl(kpis.inadimplencia)} tone="warn" />
      </div>

      <div className="grid gap-4">
        {contracts.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            Nenhum contrato ainda. Clique em "Novo contrato".
          </Card>
        )}
        {contracts.map((c) => {
          const pagos = c.installments.filter((i) => i.status === "pago").length;
          const atrasadas = c.installments.filter((i) => i.status === "atrasado").length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.clienteNome}</h3>
                    <StatusBadge status={c.status} />
                    <Badge variant="outline">{c.objetoTipo}</Badge>
                    {c.objetoLabel && <span className="text-xs text-muted-foreground">{c.objetoLabel}</span>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {brl(c.valorTotalCents)} · entrada {brl(c.entradaCents)} · {c.nParcelas}x {brl(c.valorParcelaCents)} · {c.indice}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Pagas {pagos}/{c.nParcelas} · Atrasadas {atrasadas}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(c)}>
                    Parcelas
                  </Button>
                  <Select
                    value={c.status}
                    onValueChange={(v) => setContractStatus(c.id, v as Contract["status"])}
                  >
                    <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inadimplente">Inadimplente</SelectItem>
                      <SelectItem value="quitado">Quitado</SelectItem>
                      <SelectItem value="distratado">Distratado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm("Excluir contrato?")) deleteContract(c.id);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <NewContractDialog open={open} onOpenChange={setOpen} tenantId={tenantId} />
      <InstallmentsDialog contract={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "warn" }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone === "warn" ? "text-destructive" : ""}`}>{value}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Contract["status"] }) {
  const map: Record<Contract["status"], string> = {
    ativo: "bg-primary/15 text-primary",
    quitado: "bg-emerald-500/15 text-emerald-500",
    inadimplente: "bg-destructive/15 text-destructive",
    distratado: "bg-muted text-muted-foreground",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
}

function NewContractDialog({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenantId: string;
}) {
  const [form, setForm] = useState({
    clienteNome: "",
    clienteDoc: "",
    clienteEmail: "",
    clienteTelefone: "",
    objetoTipo: "lote" as "lote" | "unidade" | "imovel",
    objetoLabel: "",
    valorTotal: "",
    entrada: "",
    nParcelas: "60",
    indice: "IGPM" as "INCC" | "IGPM" | "IPCA" | "NENHUM",
    primeiroVencimento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  function submit() {
    if (!form.clienteNome.trim()) return toast.error("Informe o nome do cliente");
    const valorTotalCents = Math.round(parseFloat(form.valorTotal || "0") * 100);
    const entradaCents = Math.round(parseFloat(form.entrada || "0") * 100);
    const n = parseInt(form.nParcelas || "0", 10);
    if (!valorTotalCents || !n) return toast.error("Preencha valor total e nº de parcelas");
    createContract({
      tenantId,
      clienteNome: form.clienteNome,
      clienteDoc: form.clienteDoc || undefined,
      clienteEmail: form.clienteEmail || undefined,
      clienteTelefone: form.clienteTelefone || undefined,
      objetoTipo: form.objetoTipo,
      objetoLabel: form.objetoLabel || undefined,
      valorTotalCents,
      entradaCents,
      nParcelas: n,
      indice: form.indice,
      primeiroVencimento: form.primeiroVencimento,
    });
    toast.success("Contrato criado");
    onOpenChange(false);
    setForm({ ...form, clienteNome: "", clienteDoc: "", clienteEmail: "", clienteTelefone: "", objetoLabel: "", valorTotal: "", entrada: "" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Novo contrato</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Cliente</Label>
            <Input value={form.clienteNome} onChange={(e) => setForm({ ...form, clienteNome: e.target.value })} />
          </div>
          <div><Label>CPF/CNPJ</Label><Input value={form.clienteDoc} onChange={(e) => setForm({ ...form, clienteDoc: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.clienteTelefone} onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={form.clienteEmail} onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })} /></div>
          <div>
            <Label>Objeto</Label>
            <Select value={form.objetoTipo} onValueChange={(v) => setForm({ ...form, objetoTipo: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lote">Lote</SelectItem>
                <SelectItem value="unidade">Unidade</SelectItem>
                <SelectItem value="imovel">Imóvel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Identificação (ex: Quadra 3 Lote 12)</Label><Input value={form.objetoLabel} onChange={(e) => setForm({ ...form, objetoLabel: e.target.value })} /></div>
          <div><Label>Valor total (R$)</Label><Input type="number" step="0.01" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} /></div>
          <div><Label>Entrada (R$)</Label><Input type="number" step="0.01" value={form.entrada} onChange={(e) => setForm({ ...form, entrada: e.target.value })} /></div>
          <div><Label>Nº parcelas</Label><Input type="number" value={form.nParcelas} onChange={(e) => setForm({ ...form, nParcelas: e.target.value })} /></div>
          <div>
            <Label>Índice de correção</Label>
            <Select value={form.indice} onValueChange={(v) => setForm({ ...form, indice: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INCC">INCC</SelectItem>
                <SelectItem value="IGPM">IGPM</SelectItem>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="NENHUM">Sem correção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>1º vencimento</Label><Input type="date" value={form.primeiroVencimento} onChange={(e) => setForm({ ...form, primeiroVencimento: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Criar contrato</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstallmentsDialog({ contract, onClose }: { contract: Contract | null; onClose: () => void }) {
  if (!contract) return null;
  return (
    <Dialog open={!!contract} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Parcelas — {contract.clienteNome}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left">Vencimento</th>
                <th className="text-right">Valor</th>
                <th className="text-left pl-4">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contract.installments.map((i) => (
                <tr key={i.n} className="border-b border-border/50">
                  <td className="py-2">{i.n}</td>
                  <td>{fmtDate(i.dueDate)}</td>
                  <td className="text-right">{brl(i.valueCents)}</td>
                  <td className="pl-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      i.status === "pago" ? "bg-emerald-500/15 text-emerald-500" :
                      i.status === "atrasado" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{i.status}</span>
                  </td>
                  <td className="text-right">
                    <Select
                      value={i.status}
                      onValueChange={(v) => markInstallment(contract.id, i.n, v as InstallmentStatus)}
                    >
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
