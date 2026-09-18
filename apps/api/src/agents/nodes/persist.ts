import type { KenzaStateType } from "../state.js";

/**
 * Persistance de la trace de conversation. Pour l'instant : trace console
 * uniquement. TODO (Étape F.18+) : écriture réelle en base une fois les
 * vrais outils de l'Étape C branchés dans catalog/cart_agent (EX-03).
 */
export async function persistNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  console.log("[persist]", {
    clientId: state.clientId,
    intention: state.intent?.intention,
    escalation: state.escalation,
    reply: state.reply,
  });
  return {};
}