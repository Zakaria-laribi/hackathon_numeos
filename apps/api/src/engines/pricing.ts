import type { Decision, Product, Promotion } from "./types.js";
import { applyDiscount } from "./discount.js";

export type PriceBreakdown = {
  ref: string;
  prix_catalogue_mad: number;
  prix_applique_mad: number;
  promotion_active: boolean;
  remise_pct: number;
  total_mad: number;
};

/** Une promotion est active si la date du jour est dans sa période. */
function activePromotion(
  ref: string,
  promotions: Promotion[],
  today: Date = new Date()
): Promotion | undefined {
  const d = today.toISOString().slice(0, 10);
  return promotions.find((p) => p.ref === ref && p.debut <= d && d <= p.fin);
}

/**
 * Politique commerciale :
 * - les prix du catalogue sont fermes, jamais inventés ;
 * - les promotions priment sur le prix normal pendant leur validité ;
 * - la remise est bornée par le plancher (voir discount.ts).
 *
 * Aucun LLM n'intervient ici. C'est la seule autorité sur les prix.
 */
export function computePrice(
  ref: string,
  quantity: number,
  catalog: Product[],
  promotions: Promotion[],
  requestedDiscountPct = 0,
  today: Date = new Date()
): Decision<PriceBreakdown> {
  const product = catalog.find((p) => p.ref === ref);
  if (!product) {
    return {
      ok: false,
      escalate: true,
      reason: `Référence ${ref} absente du catalogue : aucun prix ne peut être annoncé.`,
    };
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return {
      ok: false,
      escalate: true,
      reason: `Quantité invalide (${quantity}).`,
    };
  }

  const promo = activePromotion(ref, promotions, today);
  const unitBase = promo ? promo.prix_promo_mad : product.prix_mad;

  const discounted = applyDiscount(unitBase, requestedDiscountPct);
  if (!discounted.ok) return discounted;

  return {
    ok: true,
    value: {
      ref,
      prix_catalogue_mad: product.prix_mad,
      prix_applique_mad: discounted.value.priceMad,
      promotion_active: Boolean(promo),
      remise_pct: discounted.value.pct,
      total_mad: discounted.value.priceMad * quantity,
    },
  };
}