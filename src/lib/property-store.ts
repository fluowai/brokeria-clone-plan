import { useSyncExternalStore } from "react";

export type PropertyType = "apartamento" | "casa" | "cobertura" | "studio" | "terreno" | "comercial" | "fazenda" | "sitio" | "chacara" | "unidade" | "lote";
export type PropertyPurpose = "venda" | "aluguel";
export type Vertical = "urban" | "rural" | "developer" | "land";

export type Property = {
  id: string;
  ownerId: string;
  title: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  price: number;
  address: string;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: number;
  description: string;
  images: string[]; // data URLs
  featured: boolean;
  createdAt: number;
  vertical?: Vertical;
  // Rural
  areaHectares?: number;
  atividade?: "pecuaria" | "agricola" | "misto" | "";
  agua?: "acude" | "rio" | "poco" | "nenhum" | "";
  energia?: boolean;
  carCode?: string;
  matricula?: string;
  itr?: string;
  topografia?: string;
  distanciaCidadeKm?: number;
  // Developer (incorporadora)
  developmentName?: string;
  tipologia?: string;
  andar?: number;
  posicaoSolar?: string;
  // Land (loteadora)
  quadra?: string;
  lote?: string;
  frenteM?: number;
  parcelamentoName?: string;
};

export const PROPERTY_TYPES: { id: PropertyType; label: string }[] = [
  { id: "apartamento", label: "Apartamento" },
  { id: "casa", label: "Casa" },
  { id: "cobertura", label: "Cobertura" },
  { id: "studio", label: "Studio" },
  { id: "terreno", label: "Terreno" },
  { id: "comercial", label: "Comercial" },
];

const KEY = "squadia.properties";
const listeners = new Set<() => void>();

function read(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(items: Property[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export const propertyStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll: read,
  seed(ownerId: string) {
    const existing = read();
    if (existing.some((p) => p.ownerId === ownerId)) return;
    const now = Date.now();
    const demo: Property[] = [
      {
        id: crypto.randomUUID(), ownerId, title: "Apto 2 quartos em Pinheiros",
        type: "apartamento", purpose: "venda", price: 850000,
        address: "Rua dos Pinheiros, 500", city: "São Paulo", neighborhood: "Pinheiros",
        bedrooms: 2, bathrooms: 2, parking: 1, area: 68,
        description: "Apartamento reformado, sol da manhã, próximo ao metrô.",
        images: [], featured: true, createdAt: now,
      },
      {
        id: crypto.randomUUID(), ownerId, title: "Cobertura duplex em Moema",
        type: "cobertura", purpose: "venda", price: 3200000,
        address: "Alameda dos Nhambiquaras", city: "São Paulo", neighborhood: "Moema",
        bedrooms: 4, bathrooms: 5, parking: 3, area: 240,
        description: "Cobertura com piscina privativa e vista panorâmica.",
        images: [], featured: true, createdAt: now - 1000,
      },
    ];
    write([...existing, ...demo]);
  },
  add(p: Omit<Property, "id" | "createdAt">) {
    const full: Property = { ...p, id: crypto.randomUUID(), createdAt: Date.now() };
    write([full, ...read()]);
    return full;
  },
  update(id: string, patch: Partial<Property>) {
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  byOwner(ownerId: string) {
    return read().filter((p) => p.ownerId === ownerId);
  },
};

export function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function useProperties(ownerId: string | undefined): Property[] {
  const snap = useSyncExternalStore(
    propertyStore.subscribe,
    () => localStorage.getItem(KEY) || "[]",
    () => "[]",
  );
  if (!ownerId) return [];
  try {
    return (JSON.parse(snap) as Property[]).filter((p) => p.ownerId === ownerId);
  } catch {
    return [];
  }
}

export function findOwnerBySlug(slug: string): { id: string; name: string; company?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const users = JSON.parse(localStorage.getItem("squadia.auth.users") || "[]") as Array<{ id: string; name: string; company?: string }>;
    return users.find((u) => slugify(u.company || u.name) === slug) || null;
  } catch {
    return null;
  }
}
