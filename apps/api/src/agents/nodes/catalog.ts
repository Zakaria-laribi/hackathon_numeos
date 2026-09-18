import {
  searchProduct,
  checkStock,
  computeDelivery,
  createOrder,
  getCustomerHistory,
} from "../../tools/index.js";
import type { KenzaStateType } from "../state.js";

/**
 * Agent Catalogue : dispatche vers le bon outil réel selon l'intention
 * détectée par `extract`. N'invente jamais un prix, un stock ou un délai
 * — tout vient d'un appel SQL via les outils (engines/*.ts).
 */
export async function catalogNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const intent = state.intent;
  if (!intent) {
    return { toolResult: { ok: false, error: "aucune intention détectée" } };
  }

  const { entites } = intent;

  switch (intent.intention) {
    case "recherche_produit":
    case "demande_prix": {
      const raw = await searchProduct.invoke({
        query: entites.modele ?? entites.ref ?? "",
        couleur: entites.couleur ?? undefined,
      });
      return { toolResult: { agent: "catalog", action: "search_product", result: JSON.parse(raw) } };
    }

    case "verifier_stock": {
      if (entites.ref) {
        const raw = await checkStock.invoke({ ref: entites.ref });
        return { toolResult: { agent: "catalog", action: "check_stock", result: JSON.parse(raw) } };
      }
      // Pas de référence exacte : on cherche d'abord le produit.
      const searchRaw = await searchProduct.invoke({
        query: entites.modele ?? "",
        couleur: entites.couleur ?? undefined,
      });
      const found = JSON.parse(searchRaw);
      if (!Array.isArray(found) || found.length === 0) {
        return { toolResult: { agent: "catalog", action: "search_product", result: [], note: "aucun produit trouvé" } };
      }
      const stockRaw = await checkStock.invoke({ ref: found[0].ref });
      return { toolResult: { agent: "catalog", action: "check_stock", result: JSON.parse(stockRaw), produit: found[0] } };
    }

    case "calcul_livraison": {
      if (!entites.ville) {
        return { toolResult: { agent: "catalog", action: "compute_delivery", ok: false, missing: ["ville"] } };
      }
      const raw = await computeDelivery.invoke({ ville: entites.ville });
      return { toolResult: { agent: "catalog", action: "compute_delivery", result: JSON.parse(raw) } };
    }

    case "creer_commande": {
      const missing: string[] = [];
      if (!entites.ref) missing.push("ref");
      if (!entites.quantite) missing.push("quantite");
      if (!entites.ville) missing.push("ville");
      if (missing.length > 0) {
        return { toolResult: { agent: "catalog", action: "create_order", ok: false, missing } };
      }
      const raw = await createOrder.invoke({
        client_id: state.clientId,
        ville: entites.ville!,
        lignes: [{ ref: entites.ref!, quantite: entites.quantite!, remise_pct: 0 }],
      });
      return { toolResult: { agent: "catalog", action: "create_order", result: JSON.parse(raw) } };
    }

    case "consulter_historique": {
      const raw = await getCustomerHistory.invoke({ client_id: state.clientId });
      return { toolResult: { agent: "catalog", action: "get_customer_history", result: JSON.parse(raw) } };
    }

    default:
      return { toolResult: { agent: "catalog", ok: false, error: `intention non gérée par catalog: ${intent.intention}` } };
  }
}