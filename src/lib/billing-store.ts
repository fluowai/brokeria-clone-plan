import { useSyncExternalStore } from "react";

export type PlanId = "starter" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  credits: number;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    credits: 500,
    features: ["1 corretor", "CRM Kanban", "Site público", "500 créditos IA/mês"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 297,
    credits: 2500,
    features: ["Até 5 corretores", "WhatsApp IA", "Feeds ZAP/OLX", "2.500 créditos IA/mês", "BI Cockpit"],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 697,
    credits: 8000,
    features: ["Corretores ilimitados", "Meta Ads integrado", "Multi-imobiliária", "8.000 créditos IA/mês", "Suporte prioritário"],
  },
];

export type BillingState = {
  planId: PlanId | null;
  credits: number;
  status: "trial" | "active" | "canceled";
  trialEndsAt: string | null;
  history: Array<{ id: string; date: string; planId: PlanId; amount: number; status: "paid" | "pending" }>;
};

const KEY = "squadia:billing";

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

function defaultState(): BillingState {
  const trial = new Date();
  trial.setDate(trial.getDate() + 7);
  return {
    planId: null,
    credits: 100,
    status: "trial",
    trialEndsAt: trial.toISOString(),
    history: [],
  };
}

let state: BillingState = typeof window !== "undefined" ? load() : defaultState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const billingStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get() {
    return state;
  },
  subscribeToPlan(planId: PlanId) {
    const plan = PLANS.find((p) => p.id === planId)!;
    state = {
      ...state,
      planId,
      status: "active",
      credits: state.credits + plan.credits,
      history: [
        {
          id: `inv_${Date.now()}`,
          date: new Date().toISOString(),
          planId,
          amount: plan.price,
          status: "paid",
        },
        ...state.history,
      ],
    };
    persist();
  },
  cancel() {
    state = { ...state, status: "canceled" };
    persist();
  },
  consume(n: number) {
    state = { ...state, credits: Math.max(0, state.credits - n) };
    persist();
  },
  addCredits(n: number) {
    state = { ...state, credits: state.credits + n };
    persist();
  },
};

export function useBilling() {
  return useSyncExternalStore(
    billingStore.subscribe,
    () => billingStore.get(),
    () => defaultState(),
  );
}
