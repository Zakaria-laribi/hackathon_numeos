import { searchProduct, checkStock } from "../../tools/index.js";
import type { KenzaStateType } from "../state.js";
import type { CartUpdate } from "../../schemas/cart.js";

/**
 * Agent Panier : applique la modification demandée sur state.cart.
 * Ne recalcule aucun prix ici (rôle de pricing.ts via createOrder) —
 * se contente de maintenir une liste de lignes cohérente, validée
 * contre le catalogue réel avant tout ajout ou modification.
 */
export async function cartNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const { entites } = state.intent ?? {};
  const currentCart: CartUpdate = state.cart ?? {
    client_id: state.clientId,
    ville: null,
    lignes: [],
    action: "ajout",
  };

  // Vidage : cas simple, pas besoin de valider quoi que ce soit.
  if (!entites?.ref && !entites?.modele) {
    return {
      toolResult: { agent: "cart", ok: false, missing: ["ref ou modele"] },
    };
  }

  // Retrouver la référence exacte du produit visé (par ref directe, ou recherche par modèle/couleur/taille).
  let targetRef = entites.ref ?? null;
  if (!targetRef) {
    const searchRaw = await searchProduct.invoke({
      query: entites.modele ?? "",
      couleur: entites.couleur ?? undefined,
    });
    const found = JSON.parse(searchRaw);
    const match = entites.taille
      ? found.find((p: { taille: string }) => p.taille === entites.taille)
      : found[0];
    if (!match) {
      return {
        toolResult: { agent: "cart", ok: false, error: "produit introuvable pour cette taille/modèle" },
      };
    }
    targetRef = match.ref;
  }

  // Valider le stock avant d'ajouter/modifier.
  const stockRaw = await checkStock.invoke({ ref: targetRef! });
  const stockDecision = JSON.parse(stockRaw);
  if (!stockDecision.ok || stockDecision.value?.status !== "available") {
    return {
      toolResult: { agent: "cart", ok: false, error: "produit indisponible", stockDecision },
    };
  }

  const quantite = entites.quantite ?? 1;
  const lignesSansAncienne = currentCart.lignes.filter((l) => l.ref !== targetRef);
  const nouvellesLignes = [...lignesSansAncienne, { ref: targetRef!, quantite }];

  const updatedCart: CartUpdate = {
    client_id: state.clientId,
    ville: entites.ville ?? currentCart.ville,
    lignes: nouvellesLignes,
    action: "modification",
  };

  return {
    cart: updatedCart,
    toolResult: { agent: "cart", ok: true, cart: updatedCart },
  };
}