import type { KenzaStateType } from "../state.js";

/**
 * Stubs temporaires. Chaque agent écrit un résultat BRUT dans toolResult,
 * jamais de texte final dans reply — ça, c'est le rôle d'explainer,
 * après validation par guard.
 */


export async function cartNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { toolResult: { agent: "cart", intention: state.intent?.intention, note: "stub — vrai outil pas encore branché" } };
}


export async function policyNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { toolResult: { agent: "policy", intention: state.intent?.intention, note: "stub — RAG pas encore branché" } };
}

export async function escalateNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return {
    escalation: { reason: `hors_domaine ou cas non couvert (intention=${state.intent?.intention})` },
  };
}