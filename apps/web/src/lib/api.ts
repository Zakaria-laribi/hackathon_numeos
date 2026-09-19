import type { ConversationRow, EscalationRow, OrderRow, Stats } from "./types";

const API_BASE = "http://localhost:3000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

export const api = {
  stats: () => getJSON<Stats>("/api/stats"),
  conversations: () => getJSON<ConversationRow[]>("/api/conversations"),
  escalations: () => getJSON<EscalationRow[]>("/api/escalations"),
  orders: () => getJSON<OrderRow[]>("/api/orders"),
};