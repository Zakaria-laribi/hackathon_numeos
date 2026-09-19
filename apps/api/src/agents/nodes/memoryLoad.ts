import type { KenzaStateType } from "../state.js";

/**
 * Placeholder avant le vrai checkpointer Postgres (Étape G). Pour
 * l'instant, ce nœud ne fait rien de concret : sans checkpointer, l'état
 * ne survit de toute façon pas entre deux appels à kenzaGraph.invoke().
 * Une fois le checkpointer branché, LangGraph restaurera automatiquement
 * l'état complet (dont cart) par thread_id avant même que ce nœud ne
 * s'exécute — ce nœud pourra alors, par exemple, journaliser ce qui a
 * été restauré, sans changer sa position dans le graphe.
 */
export async function memoryLoadNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  console.log("[memory_load]", { clientId: state.clientId, cartPresent: state.cart !== null });
  return {};
}