import type { KenzaStateType } from "../state.js";

/**
 * Stubs temporaires. Chaque agent spécialisé sera remplacé par sa vraie
 * implémentation (outils réels, RAG, escalade avec contexte) aux étapes
 * suivantes. Pour l'instant, ils prouvent juste que le routage fonctionne.
 */
export async function catalogNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { reply: `[catalog] intention=${state.intent?.intention}` };
}

export async function cartNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { reply: `[cart] intention=${state.intent?.intention}` };
}

export async function discountNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { reply: `[discount] intention=${state.intent?.intention}` };
}

export async function policyNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return { reply: `[policy] intention=${state.intent?.intention}` };
}

export async function escalateNode(state: KenzaStateType): Promise<Partial<KenzaStateType>> {
  return {
    reply: `[escalate] intention=${state.intent?.intention}`,
    escalation: { reason: "hors_domaine ou cas non couvert" },
  };
}