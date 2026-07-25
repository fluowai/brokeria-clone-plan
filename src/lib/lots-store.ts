import { useSyncExternalStore } from "react";

export type LotStatus = "disponivel" | "reservado" | "vendido" | "quitado";

export type Lot = {
  id: string;
  ownerId: string;
  parcelamento: string;
  quadra: string;
  lote: string;
  areaM2: number;
  frenteM?: number;
  precoAvista: number;
  precoParcelado?: number;
  entrada?: number;
  parcelas?: number;
  status: LotStatus;
  x: number; // grid col
  y: number; // grid row
  clienteNome?: string;
  reservedUntil?: number;
  createdAt: number;
};

const KEY = "squadia.lots";
const listeners = new Set<() => void>();

function read(): Lot[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: Lot[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const STATUS_META: Record<LotStatus, { label: string; color: string; bg: string }> = {
  disponivel: { label: "Disponível", color: "text-emerald-500", bg: "bg-emerald-500/20 border-emerald-500/60" },
  reservado: { label: "Reservado", color: "text-amber-500", bg: "bg-amber-500/25 border-amber-500/60" },
  vendido: { label: "Vendido", color: "text-sky-500", bg: "bg-sky-500/25 border-sky-500/60" },
  quitado: { label: "Quitado", color: "text-primary", bg: "bg-primary/25 border-primary/60" },
};

export const lotsStore = {
  subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); },
  getAll: read,
  seed(ownerId: string) {
    const existing = read();
    if (existing.some((l) => l.ownerId === ownerId)) return;
    const demo: Lot[] = [];
    const quadras = ["A", "B", "C"];
    quadras.forEach((q, qi) => {
      for (let i = 1; i <= 8; i++) {
        const rand = Math.random();
        const status: LotStatus = rand < 0.55 ? "disponivel" : rand < 0.75 ? "reservado" : rand < 0.92 ? "vendido" : "quitado";
        demo.push({
          id: crypto.randomUUID(), ownerId, parcelamento: "Residencial Alvorada",
          quadra: q, lote: String(i).padStart(2, "0"),
          areaM2: 250 + Math.floor(Math.random() * 200),
          frenteM: 10 + Math.floor(Math.random() * 5),
          precoAvista: 90000 + Math.floor(Math.random() * 60000),
          precoParcelado: 120000, entrada: 15000, parcelas: 120,
          status, x: i - 1, y: qi, createdAt: Date.now() - Math.random() * 1e7,
        });
      }
    });
    write([...existing, ...demo]);
  },
  add(l: Omit<Lot, "id" | "createdAt">) {
    const full: Lot = { ...l, id: crypto.randomUUID(), createdAt: Date.now() };
    write([full, ...read()]); return full;
  },
  update(id: string, patch: Partial<Lot>) {
    write(read().map((l) => (l.id === id ? { ...l, ...patch } : l)));
  },
  remove(id: string) { write(read().filter((l) => l.id !== id)); },
};

export function useLots(ownerId: string | undefined): Lot[] {
  const snap = useSyncExternalStore(
    lotsStore.subscribe,
    () => localStorage.getItem(KEY) || "[]",
    () => "[]",
  );
  if (!ownerId) return [];
  try { return (JSON.parse(snap) as Lot[]).filter((l) => l.ownerId === ownerId); } catch { return []; }
}
