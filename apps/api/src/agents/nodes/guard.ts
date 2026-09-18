import type { KenzaStateType } from "../state.js";

/**
 * Garde-fou : dernier rempart avant que explainer rédige du texte.
 * Ne calcule rien, n'invente rien — vérifie juste que l'agent a de quoi
 * répondre sans halluciner un prix, un délai ou une politique.
 *
 * Règle actuelle (stub) : si aucune escalade n'est déjà décidée ET
 * qu'aucun résultat d'outil n'existe, on refuse de laisser explainer
 * improviser : on force l'escalade plutôt que risquer une réponse
 * inventée. Cette règle se durcira quand les vrais outils (Étape C)
 * seront branchés : on pourra alors vérifier des champs précis
 * (prix cohérent avec le catalogue, stock non négatif, etc.).
 */
export async function guardNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  if (state.escalation) {
    return {}; // déjà escaladé par route/escalateNode, rien à faire de plus
  }

  if (state.toolResult === null || state.toolResult === undefined) {
    return {
      escalation: {
        reason: "guard: aucun résultat d'outil disponible, refus d'improviser une réponse",
      },
    };
  }

  return {}; // toolResult présent, explainer peut rédiger à partir de lui
}