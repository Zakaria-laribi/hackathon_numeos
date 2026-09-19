import { searchProduct, checkStock } from "../../tools/index.js";
import { pool } from "../../db/pool.js";
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

  let modeleHint = entites?.modele ?? null;
  let couleurHint = entites?.couleur ?? null;
  const refHint = entites?.ref ?? null;
  let oldRefToReplace: string | null = null;

  // Fallback mémoire : ni ref ni modèle donnés dans le message, mais le
  // panier (restauré par le checkpointer, Étape G) ne contient qu'une
  // seule ligne -> on suppose que le client parle de cet article, sans
  // lui redemander ce qu'il a déjà précisé plus tôt.
  if (!refHint && !modeleHint && currentCart.lignes.length === 1) {
    oldRefToReplace = currentCart.lignes[0].ref;
    const { rows } = await pool.query<{ modele: string; couleur: string }>(
      "SELECT modele, couleur FROM products WHERE ref = $1",
      [oldRefToReplace]
    );
    if (rows[0]) {
      modeleHint = rows[0].modele;
      couleurHint = couleurHint ?? rows[0].couleur;
    }
  }

  // Vidage : cas simple, pas besoin de valider quoi que ce soit.
  if (!refHint && !modeleHint) {
    return {
      toolResult: { agent: "cart", ok: false, missing: ["ref ou modele"] },
    };
  }

  // Retrouver la référence exacte du produit visé (par ref directe, ou recherche par modèle/couleur/taille).
  let targetRef = refHint;
  if (!targetRef) {
    const searchRaw = await searchProduct.invoke({
      query: modeleHint ?? "",
      couleur: couleurHint ?? undefined,
    });
    const found = JSON.parse(searchRaw);
    const match = entites?.taille
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

  const quantite = entites?.quantite ?? 1;
  const lignesSansAncienne = currentCart.lignes.filter(
    (l) => l.ref !== targetRef && l.ref !== oldRefToReplace
  );
  
  const nouvellesLignes = [...lignesSansAncienne, { ref: targetRef!, quantite }];

  // Persiste le panier dans la table carts (en plus du checkpointer) : c'est
  // ce qui permet au worker de relance (Etape H) de detecter les paniers
  // abandonnes sans devoir lire l'etat interne de LangGraph.
  await pool.query(
    `INSERT INTO carts (customer_id, statut, lignes, updated_at)
     VALUES ($1, 'open', $2, now())
     ON CONFLICT (customer_id) DO UPDATE SET
       statut = 'open', lignes = EXCLUDED.lignes, updated_at = now(), relance_envoyee_at = NULL`,
    [state.clientId, JSON.stringify(nouvellesLignes)]
  );

  const updatedCart: CartUpdate = {
    client_id: state.clientId,
    ville: entites?.ville ?? currentCart.ville,
    lignes: nouvellesLignes,
    action: "modification",
  };

  return {
    cart: updatedCart,
    toolResult: { agent: "cart", ok: true, cart: updatedCart },
  };
}