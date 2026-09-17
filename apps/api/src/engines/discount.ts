import type { Decision } from "./types.js";

const FLOOR_PCT = Number(process.env.DISCOUNT_FLOOR_PCT ?? 10);

/**
 * Politique commerciale : remise maximale sans validation humaine = 10%.
 * En dessous du plancher, l'agent escalade. Il ne négocie pas au-delà,
 * même si le client insiste.
 *
 * Cette fonction est la SEULE autorité sur les remises. Le LLM ne décide rien.
 */
export function applyDiscount(
  basePriceMad: number,
  requestedPct: number
): Decision<{ pct: number; priceMad: number; capped: boolean }> {
  if (requestedPct <= 0) {
    return { ok: true, value: { pct: 0, priceMad: basePriceMad, capped: false } };
  }

  if (requestedPct > FLOOR_PCT) {
    return {
      ok: false,
      escalate: true,
      reason: `Remise demandée de ${requestedPct}% supérieure au plancher autorisé de ${FLOOR_PCT}%.`,
    };
  }

  const priceMad = Math.round(basePriceMad * (1 - requestedPct / 100));
  return { ok: true, value: { pct: requestedPct, priceMad, capped: false } };
}
