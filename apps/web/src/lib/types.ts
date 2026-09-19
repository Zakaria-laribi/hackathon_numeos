export interface Intent {
  intention: string;
  entites: Record<string, unknown>;
  langue_detectee: "fr" | "ar" | "darija";
}

export interface ChatResponse {
  reply: string;
  intent: Intent | null;
  toolResult: unknown;
  escalation: { reason: string } | null;
}

export interface ConversationRow {
  id: number;
  customer_id: string;
  thread_id: string;
  started_at: string;
  dernier_message: string | null;
  nb_messages: number;
}

export interface EscalationRow {
  id: number;
  reason: string;
  statut: string;
  created_at: string;
  customer_id: string;
  conversation_id: number;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  statut: string;
  total_mad: number;
  ville_livraison: string;
  created_at: string;
}

export interface Stats {
  conversations: number;
  commandes: number;
  ventes_total_mad: number;
  taux_conversion: number;
}