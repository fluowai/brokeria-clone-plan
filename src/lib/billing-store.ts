import { useSyncExternalStore } from "react";
import type { Vertical } from "./property-store";

export type PlanTier = "starter" | "growth" | "scale" | "enterprise";
export type PlanId = `${Vertical}-${PlanTier}` | PlanTier;

export type Plan = {
  id: PlanId;
  tier: PlanTier;
  vertical: Vertical;
  name: string;
  price: number;
  credits: number;
  limits: {
    users: number; // -1 = ilimitado
    units: number; // imóveis / lotes / unidades
    whatsappNumbers: number;
  };
  features: string[];
  highlight?: boolean;
};

// Multiplicadores por vertical (rural/loteadora/incorp custam mais por escala/complexidade)
const VERTICAL_MULT: Record<Vertical, number> = {
  urban: 1,
  rural: 1.2,
  developer: 1.8,
  land: 1.5,
};

const BASE: Array<Omit<Plan, "vertical" | "price" | "id" | "name"> & { name: string }> = [
  {
    tier: "starter",
    name: "Starter",
    price: 97,
    credits: 500,
    limits: { users: 1, units: 25, whatsappNumbers: 1 },
    features: ["1 usuário", "CRM Kanban", "Site público", "500 créditos IA/mês"],
  },
  {
    tier: "growth",
    name: "Growth",
    price: 297,
    credits: 2500,
    limits: { users: 5, units: 150, whatsappNumbers: 2 },
    features: ["Até 5 usuários", "WhatsApp IA", "Feeds XML", "2.500 créditos IA/mês", "BI Cockpit"],
    highlight: true,
  },
  {
    tier: "scale",
    name: "Scale",
    price: 697,
    credits: 8000,
    limits: { users: 20, units: 800, whatsappNumbers: 5 },
    features: ["Até 20 usuários", "Meta Ads integrado", "Contratos & régua", "8.000 créditos IA/mês", "Suporte prioritário"],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: 1997,
    credits: 25000,
    limits: { users: -1, units: -1, whatsappNumbers: -1 },
    features: ["Usuários ilimitados", "Estoque ilimitado", "SLA dedicado", "White-label", "Onboarding assistido"],
  },
];

// Ajustes finos por vertical (ex.: incorporadora vende por unidade, escala rápido)
const VERTICAL_LIMITS_OVERRIDE: Partial<Record<Vertical, Partial<Record<PlanTier, Partial<Plan["limits"]>>>>> = {
  developer: {
    starter: { units: 60 },
    growth: { units: 300 },
    scale: { units: 1500 },
  },
  land: {
    starter: { units: 100 },
    growth: { units: 500 },
    scale: { units: 2500 },
  },
  rural: {
    starter: { units: 15 },
    growth: { units: 80 },
    scale: { units: 300 },
  },
};

const VERTICAL_LABEL: Record<Vertical, string> = {
  urban: "Urbano",
  rural: "Rural",
  developer: "Incorporadora",
  land: "Loteadora",
};

function buildPlans(vertical: Vertical): Plan[] {
  const mult = VERTICAL_MULT[vertical];
  return BASE.map((b) => {
    const override = VERTICAL_LIMITS_OVERRIDE[vertical]?.[b.tier] ?? {};
    return {
      ...b,
      vertical,
      id: `${vertical}-${b.tier}` as PlanId,
      name: `${b.name} · ${VERTICAL_LABEL[vertical]}`,
      price: Math.round(b.price * mult),
      limits: { ...b.limits, ...override },
    };
  });
}

const PLAN_MATRIX: Record<Vertical, Plan[]> = {
  urban: buildPlans("urban"),
  rural: buildPlans("rural"),
  developer: buildPlans("developer"),
  land: buildPlans("land"),
};

export function plansFor(vertical: Vertical): Plan[] {
  return PLAN_MATRIX[vertical];
}

export function planById(id: PlanId): Plan | undefined {
  for (const arr of Object.values(PLAN_MATRIX)) {
    const p = arr.find((x) => x.id === id);
    if (p) return p;
  }
  return undefined;
}

// Compat: `PLANS` legado (urbano) para telas antigas.
export const PLANS: Plan[] = PLAN_MATRIX.urban;

export type BillingState = {
  planId: PlanId | null;
  credits: number;
  status: "trial" | "active" | "canceled";
  trialEndsAt: string | null;
  history: Array<{ id: string; date: string; planId: PlanId; amount: number; status: "paid" | "pending" }>;
};

const KEY = "squadia:billing";

function defaultState(): BillingState {
  const trial = new Date();
  trial.setDate(trial.getDate() + 7);
  return { planId: null, credits: 100, status: "trial", trialEndsAt: trial.toISOString(), history: [] };
}

function load(): BillingState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = defaultState();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

let state: BillingState = typeof window !== "undefined" ? load() : defaultState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const billingStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  subscribeToPlan(planId: PlanId) {
    const plan = planById(planId);
    if (!plan) return;
    state = {
      ...state,
      planId,
      status: "active",
      credits: state.credits + plan.credits,
      history: [
        { id: `inv_${Date.now()}`, date: new Date().toISOString(), planId, amount: plan.price, status: "paid" },
        ...state.history,
      ],
    };
    persist();
  },
  cancel() { state = { ...state, status: "canceled" }; persist(); },
  consume(n: number) { state = { ...state, credits: Math.max(0, state.credits - n) }; persist(); },
  addCredits(n: number) { state = { ...state, credits: state.credits + n }; persist(); },
};

export function useBilling() {
  return useSyncExternalStore(
    billingStore.subscribe,
    () => billingStore.get(),
    () => defaultState(),
  );
}

/** Compara uso atual com o limite do plano ativo (ou trial). */
export function computeUsage(opts: {
  planId: PlanId | null;
  vertical: Vertical;
  users: number;
  units: number;
  whatsappNumbers: number;
}) {
  const trialLimits = { users: 1, units: 10, whatsappNumbers: 1 };
  const plan = opts.planId ? planById(opts.planId) : null;
  const limits = plan?.limits ?? trialLimits;
  const pct = (used: number, limit: number) => (limit === -1 ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100)));
  return {
    limits,
    users: { used: opts.users, limit: limits.users, pct: pct(opts.users, limits.users), over: limits.users !== -1 && opts.users > limits.users },
    units: { used: opts.units, limit: limits.units, pct: pct(opts.units, limits.units), over: limits.units !== -1 && opts.units > limits.units },
    whatsapp: { used: opts.whatsappNumbers, limit: limits.whatsappNumbers, pct: pct(opts.whatsappNumbers, limits.whatsappNumbers), over: limits.whatsappNumbers !== -1 && opts.whatsappNumbers > limits.whatsappNumbers },
  };
}
