import type { KenzaStateType } from "../state.js";

/**
 * Fonction de routage pure : ne modifie jamais l'état, retourne juste
 * le nom du prochain nœud. Branchée via addConditionalEdges().
 */
export function routeDecision(state: KenzaStateType): string {
  const intention = state.intent?.intention;

  switch (intention) {
    case "recherche_produit":
    case "verifier_stock":
    case "demande_prix":
    case "calcul_livraison":
    case "creer_commande":
    case "consulter_historique":
      return "catalog";
    case "mise_a_jour_panier":
      return "cart_agent";
    case "demande_remise":
      return "discount";
    case "question_politique":
      return "policy";
    case "hors_domaine":
    default:
      return "escalate";
  }
}