import { useSyncExternalStore } from "react";

export type WAMessage = {
  id: string;
  from: "contact" | "me";
  text: string;
  ts: number;
  status?: "sent" | "delivered" | "read" | "failed";
};

export type WAConversation = {
  wa_id: string; // phone in E.164 without +
  name?: string;
  messages: WAMessage[];
  updated_at: number;
  unread: number;
};

export type WAConfig = {
  phoneNumberId: string;
  displayNumber: string;
  webhookVerifyToken: string; // display only; real one is server env
  autoReplyAgent: "none" | "BIA" | "DONNA" | "COPY";
};

const CONV_KEY = "squadia:wa:conversations";
const CFG_KEY = "squadia:wa:config";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read<T>(k: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  emit();
}

export const waStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getConversations(): WAConversation[] {
    return read<WAConversation[]>(CONV_KEY, []);
  },
  getConfig(): WAConfig {
    return read<WAConfig>(CFG_KEY, {
      phoneNumberId: "",
      displayNumber: "",
      webhookVerifyToken: "",
      autoReplyAgent: "none",
    });
  },
  saveConfig(cfg: WAConfig) {
    write(CFG_KEY, cfg);
  },
  upsertMessage(wa_id: string, msg: WAMessage, name?: string) {
    const list = waStore.getConversations();
    let conv = list.find((c) => c.wa_id === wa_id);
    if (!conv) {
      conv = { wa_id, name, messages: [], updated_at: Date.now(), unread: 0 };
      list.push(conv);
    }
    conv.messages.push(msg);
    conv.updated_at = msg.ts;
    if (name) conv.name = name;
    if (msg.from === "contact") conv.unread += 1;
    write(CONV_KEY, list);
  },
  markRead(wa_id: string) {
    const list = waStore.getConversations();
    const conv = list.find((c) => c.wa_id === wa_id);
    if (conv) {
      conv.unread = 0;
      write(CONV_KEY, list);
    }
  },
  remove(wa_id: string) {
    write(CONV_KEY, waStore.getConversations().filter((c) => c.wa_id !== wa_id));
  },
};

export function useConversations() {
  return useSyncExternalStore(waStore.subscribe, waStore.getConversations, () => []);
}
export function useWAConfig() {
  return useSyncExternalStore(waStore.subscribe, waStore.getConfig, () => waStore.getConfig());
}
