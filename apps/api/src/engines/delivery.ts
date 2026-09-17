import type { Decision, DeliveryRule } from "./types.js";

/** Normalise une ville : casse, accents, espaces. "fes" == "Fès". */
function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Politique commerciale : frais et délais viennent EXCLUSIVEMENT de la grille.
 * Une ville absente déclenche une escalade, jamais une estimation.
 */
export function quoteDelivery(
  city: string,
  grid: DeliveryRule[]
): Decision<DeliveryRule> {
  const target = normalizeCity(city);
  const rule = grid.find((r) => normalizeCity(r.ville) === target);

  if (!rule) {
    return {
      ok: false,
      escalate: true,
      reason: `Ville « ${city} » absente de la grille de livraison. Aucune estimation n'est permise.`,
    };
  }

  return { ok: true, value: rule };
}

/**
 * Le paiement à la livraison n'est possible que là où la grille l'indique.
 */
export function canPayOnDelivery(
  city: string,
  grid: DeliveryRule[]
): Decision<boolean> {
  const rule = quoteDelivery(city, grid);
  if (!rule.ok) return rule;
  return { ok: true, value: rule.value.paiement_a_la_livraison };
}