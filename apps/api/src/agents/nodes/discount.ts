import { searchProduct } from "../../tools/index.js";
import { applyDiscount } from "../../engines/discount.js";
import type { KenzaStateType } from "../state.js";

/**
 * Agent Remise : la SEULE autorité sur les remises est applyDiscount()
 * (engines/discount.ts). Ce nœud ne fait que trouver le prix de base
 * puis lui appliquer le moteur — jamais de calcul ou de décision ici,
 * et surtout jamais par le LLM (voir explainer, qui ne fait que rédiger).
 */
export async function discountNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const { entites } = state.intent ?? {};
  const requestedPct = entites?.remise_demandee_pct;

  if (requestedPct === null || requestedPct === undefined) {
    return {
      toolResult: { agent: "discount", ok: false, missing: ["remise_demandee_pct"] },
    };
  }

  // Trouver le produit concerné pour connaître son prix de base.
  const searchRaw = await searchProduct.invoke({
    query: entites?.modele ?? entites?.ref ?? "",
    couleur: entites?.couleur ?? undefined,
  });
  const found = JSON.parse(searchRaw);

  if (!Array.isArray(found) || found.length === 0) {
    return {
      toolResult: { agent: "discount", ok: false, error: "produit introuvable pour appliquer la remise" },
    };
  }

  const product = found[0];
  const decision = applyDiscount(Number(product.prix_mad), requestedPct);

  if (!decision.ok) {
    // Plancher dépassé : escalade immédiate, jamais de négociation au-delà.
    return {
      toolResult: { agent: "discount", ok: false, produit: product },
      escalation: { reason: decision.reason },
    };
  }

  return {
    toolResult: {
      agent: "discount",
      ok: true,
      produit: product,
      remise: decision.value,
    },
  };
}