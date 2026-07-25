import { useSyncExternalStore } from "react";

export type UnitStatus = "disponivel" | "reservado" | "vendido" | "quitado";

export type Unit = {
  id: string;
  torre: string;
  andar: number;
  numero: string;
  tipologia: string;
  areaM2: number;
  bedrooms: number;
  precoTabela: number;
  status: UnitStatus;
  clienteNome?: string;
};

export type Development = {
  id: string;
  ownerId: string;
  name: string;
  status: "lancamento" | "obras" | "pronto";
  previsaoEntrega?: string;
  vgv: number;
  torres: number;
  unidadesTotal: number;
  obraPercent: number;
  memorial?: string;
  tour360Url?: string;
  standEndereco?: string;
  city?: string;
  state?: string;
  coverUrl?: string;
  units: Unit[];
  createdAt: number;
};

const KEY = "squadia.developments";
const listeners = new Set<() => void>();

function read(): Development[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: Development[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const UNIT_STATUS_META: Record<UnitStatus, { label: string; bg: string; text: string }> = {
  disponivel: { label: "Disponível", bg: "bg-emerald-500/20 border-emerald-500/60", text: "text-emerald-500" },
  reservado: { label: "Reservado", bg: "bg-amber-500/25 border-amber-500/60", text: "text-amber-500" },
  vendido: { label: "Vendido", bg: "bg-sky-500/25 border-sky-500/60", text: "text-sky-500" },
  quitado: { label: "Quitado", bg: "bg-primary/25 border-primary/60", text: "text-primary" },
};

function buildDemoUnits(torres: number, andaresPorTorre = 10, unidadesPorAndar = 4): Unit[] {
  const units: Unit[] = [];
  for (let t = 1; t <= torres; t++) {
    for (let a = 1; a <= andaresPorTorre; a++) {
      for (let u = 1; u <= unidadesPorAndar; u++) {
        const r = Math.random();
        const status: UnitStatus = r < 0.55 ? "disponivel" : r < 0.78 ? "reservado" : r < 0.94 ? "vendido" : "quitado";
        units.push({
          id: crypto.randomUUID(),
          torre: `T${t}`,
          andar: a,
          numero: `${a}${String(u).padStart(2, "0")}`,
          tipologia: u % 2 === 0 ? "2 dorm" : "3 dorm",
          areaM2: 55 + (u % 2) * 15,
          bedrooms: u % 2 === 0 ? 2 : 3,
          precoTabela: 480000 + Math.floor(Math.random() * 200000),
          status,
        });
      }
    }
  }
  return units;
}

export const developmentsStore = {
  subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); },
  getAll: read,
  seed(ownerId: string) {
    const existing = read();
    if (existing.some((d) => d.ownerId === ownerId)) return;
    const torres = 2;
    const demo: Development = {
      id: crypto.randomUUID(), ownerId,
      name: "Residencial Aurora",
      status: "obras",
      previsaoEntrega: "2026-12",
      vgv: 42_000_000,
      torres, unidadesTotal: torres * 10 * 4,
      obraPercent: 45,
      memorial: "Fachada em ACM, hall decorado, piscina, academia, coworking.",
      tour360Url: "",
      standEndereco: "Av. Central, 1200",
      city: "São Paulo", state: "SP",
      units: buildDemoUnits(torres),
      createdAt: Date.now(),
    };
    write([demo, ...existing]);
  },
  add(d: Omit<Development, "id" | "createdAt" | "units"> & { units?: Unit[] }) {
    const full: Development = {
      ...d,
      units: d.units ?? buildDemoUnits(d.torres || 1),
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    write([full, ...read()]);
    return full;
  },
  update(id: string, patch: Partial<Development>) {
    write(read().map((d) => (d.id === id ? { ...d, ...patch } : d)));
  },
  remove(id: string) { write(read().filter((d) => d.id !== id)); },
  setUnitStatus(devId: string, unitId: string, status: UnitStatus, clienteNome?: string) {
    write(read().map((d) => d.id !== devId ? d : ({
      ...d,
      units: d.units.map((u) => u.id === unitId ? { ...u, status, clienteNome: clienteNome ?? u.clienteNome } : u),
    })));
  },
};

export function useDevelopments(ownerId: string | undefined): Development[] {
  const snap = useSyncExternalStore(
    developmentsStore.subscribe,
    () => localStorage.getItem(KEY) || "[]",
    () => "[]",
  );
  if (!ownerId) return [];
  try { return (JSON.parse(snap) as Development[]).filter((d) => d.ownerId === ownerId); } catch { return []; }
}
