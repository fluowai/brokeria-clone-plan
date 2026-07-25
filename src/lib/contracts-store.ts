import { useSyncExternalStore } from "react";

export type ContractStatus = "ativo" | "quitado" | "distratado" | "inadimplente";
export type InstallmentStatus = "pendente" | "pago" | "atrasado";

export type Installment = {
  n: number;
  dueDate: string; // YYYY-MM-DD
  valueCents: number;
  status: InstallmentStatus;
  paidAt?: string;
};

export type Contract = {
  id: string;
  tenantId: string;
  clienteNome: string;
  clienteDoc?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  objetoTipo: "lote" | "unidade" | "imovel";
  objetoRef?: string; // lot id, unit id, or property id/label
  objetoLabel?: string;
  valorTotalCents: number;
  entradaCents: number;
  nParcelas: number;
  valorParcelaCents: number;
  indice: "INCC" | "IGPM" | "IPCA" | "NENHUM";
  primeiroVencimento: string; // YYYY-MM-DD
  status: ContractStatus;
  assinadoEm: string;
  installments: Installment[];
};

const KEY = "squadia:contracts:v1";
const listeners = new Set<() => void>();
let cache: Contract[] | null = null;

function read(): Contract[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
function write(v: Contract[]) {
  cache = v;
  localStorage.setItem(KEY, JSON.stringify(v));
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useContracts(tenantId?: string) {
  const all = useSyncExternalStore(subscribe, read, () => []);
  return tenantId ? all.filter((c) => c.tenantId === tenantId) : all;
}

function addMonths(iso: string, months: number) {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function buildInstallments(
  n: number,
  first: string,
  valueCents: number,
): Installment[] {
  const today = new Date().toISOString().slice(0, 10);
  return Array.from({ length: n }, (_, i) => {
    const due = addMonths(first, i);
    return {
      n: i + 1,
      dueDate: due,
      valueCents,
      status: due < today ? "atrasado" : "pendente",
    } as Installment;
  });
}

export function createContract(input: Omit<Contract, "id" | "installments" | "valorParcelaCents" | "status" | "assinadoEm"> & { status?: ContractStatus }): Contract {
  const all = read();
  const restante = Math.max(0, input.valorTotalCents - input.entradaCents);
  const valorParcelaCents = input.nParcelas > 0 ? Math.round(restante / input.nParcelas) : 0;
  const c: Contract = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "ativo",
    assinadoEm: new Date().toISOString(),
    valorParcelaCents,
    installments: buildInstallments(input.nParcelas, input.primeiroVencimento, valorParcelaCents),
  };
  write([c, ...all]);
  return c;
}

export function markInstallment(contractId: string, n: number, status: InstallmentStatus) {
  const all = read();
  const next = all.map((c) => {
    if (c.id !== contractId) return c;
    const installments = c.installments.map((i) =>
      i.n === n ? { ...i, status, paidAt: status === "pago" ? new Date().toISOString() : undefined } : i,
    );
    const allPaid = installments.every((i) => i.status === "pago");
    const hasLate = installments.some((i) => i.status === "atrasado");
    const cStatus: ContractStatus = allPaid ? "quitado" : hasLate ? "inadimplente" : c.status === "distratado" ? "distratado" : "ativo";
    return { ...c, installments, status: cStatus };
  });
  write(next);
}

export function setContractStatus(id: string, status: ContractStatus) {
  write(read().map((c) => (c.id === id ? { ...c, status } : c)));
}

export function deleteContract(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function refreshLateStatuses() {
  const today = new Date().toISOString().slice(0, 10);
  const all = read();
  let changed = false;
  const next = all.map((c) => {
    const installments = c.installments.map((i) => {
      if (i.status === "pendente" && i.dueDate < today) {
        changed = true;
        return { ...i, status: "atrasado" as InstallmentStatus };
      }
      return i;
    });
    return { ...c, installments };
  });
  if (changed) write(next);
}

export function contractKpis(contracts: Contract[]) {
  const vgv = contracts.reduce((s, c) => s + c.valorTotalCents, 0);
  const recebido = contracts.reduce(
    (s, c) => s + c.entradaCents + c.installments.filter((i) => i.status === "pago").reduce((a, i) => a + i.valueCents, 0),
    0,
  );
  const inadimplencia = contracts.reduce(
    (s, c) => s + c.installments.filter((i) => i.status === "atrasado").reduce((a, i) => a + i.valueCents, 0),
    0,
  );
  const ativos = contracts.filter((c) => c.status === "ativo" || c.status === "inadimplente").length;
  return { vgv, recebido, inadimplencia, ativos };
}
