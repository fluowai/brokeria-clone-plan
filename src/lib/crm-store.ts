import { useSyncExternalStore } from "react";

export type LeadStage = "novo" | "qualificado" | "visita" | "proposta" | "fechado";

export const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: "novo", label: "Novo Lead", color: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  { id: "qualificado", label: "Qualificado", color: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  { id: "visita", label: "Visita Agendada", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { id: "proposta", label: "Proposta", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  { id: "fechado", label: "Fechado", color: "bg-primary/20 text-primary border-primary/40" },
];

export type Lead = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: string;
  interest: string;
  budget?: number;
  stage: LeadStage;
  ownerId: string;
  createdAt: number;
  notes?: string;
};

const KEY = "squadia.crm.leads";
const listeners = new Set<() => void>();

function read(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(leads: Lead[]) {
  localStorage.setItem(KEY, JSON.stringify(leads));
  listeners.forEach((l) => l());
}

function seed(ownerId: string) {
  const existing = read();
  if (existing.some((l) => l.ownerId === ownerId)) return;
  const now = Date.now();
  const demo: Lead[] = [
    { id: crypto.randomUUID(), name: "Ana Ribeiro", phone: "+55 11 98888-1111", source: "WhatsApp", interest: "Apto 2 quartos - Pinheiros", budget: 850000, stage: "novo", ownerId, createdAt: now },
    { id: crypto.randomUUID(), name: "Carlos Souza", phone: "+55 11 97777-2222", source: "Meta Ads", interest: "Casa condomínio - Alphaville", budget: 1800000, stage: "qualificado", ownerId, createdAt: now },
    { id: crypto.randomUUID(), name: "Marina Alves", email: "marina@mail.com", source: "Site", interest: "Studio - Centro", budget: 420000, stage: "visita", ownerId, createdAt: now },
    { id: crypto.randomUUID(), name: "Pedro Lima", phone: "+55 11 96666-3333", source: "Indicação", interest: "Cobertura - Moema", budget: 3200000, stage: "proposta", ownerId, createdAt: now },
    { id: crypto.randomUUID(), name: "Julia Torres", phone: "+55 11 95555-4444", source: "OLX", interest: "Apto 3 quartos - Vila Mariana", budget: 1100000, stage: "fechado", ownerId, createdAt: now },
  ];
  write([...existing, ...demo]);
}

export const crmStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll: read,
  seed,
  add(lead: Omit<Lead, "id" | "createdAt">) {
    const full: Lead = { ...lead, id: crypto.randomUUID(), createdAt: Date.now() };
    write([full, ...read()]);
    return full;
  },
  update(id: string, patch: Partial<Lead>) {
    write(read().map((l) => (l.id === id ? { ...l, ...patch } : l)));
  },
  remove(id: string) {
    write(read().filter((l) => l.id !== id));
  },
  move(id: string, stage: LeadStage) {
    write(read().map((l) => (l.id === id ? { ...l, stage } : l)));
  },
};

export function useLeads(ownerId: string | undefined): Lead[] {
  const snapshot = useSyncExternalStore(
    crmStore.subscribe,
    () => localStorage.getItem(KEY) || "[]",
    () => "[]",
  );
  if (!ownerId) return [];
  try {
    const all: Lead[] = JSON.parse(snapshot);
    return all.filter((l) => l.ownerId === ownerId);
  } catch {
    return [];
  }
}
