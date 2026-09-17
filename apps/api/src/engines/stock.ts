import type { Decision, Product } from "./types.js";

export type Availability =
  | { status: "available"; product: Product }
  | { status: "out_of_stock"; ref: string; alternatives: Product[] };

/**
 * Politique commerciale : stock zéro = indisponible.
 * L'agent propose une alternative RÉELLEMENT disponible.
 *
 * ⚠️ `delai_reassort_jours` n'est jamais exposé : la politique interdit
 * de promettre une date de réassort, même quand la colonne est renseignée.
 */
export function checkAvailability(
  ref: string,
  catalog: Product[]
): Decision<Availability> {
  const product = catalog.find((p) => p.ref === ref);

  if (!product) {
    return {
      ok: false,
      escalate: true,
      reason: `Référence ${ref} absente du catalogue. Demande hors catalogue.`,
    };
  }

  if (product.stock > 0) {
    return { ok: true, value: { status: "available", product } };
  }

  return {
    ok: true,
    value: {
      status: "out_of_stock",
      ref,
      alternatives: findAlternatives(product, catalog),
    },
  };
}

/** Alternatives réellement en stock : même famille, puis proches en prix. */
function findAlternatives(target: Product, catalog: Product[]): Product[] {
  return catalog
    .filter((p) => p.stock > 0 && p.ref !== target.ref)
    .filter((p) => p.famille === target.famille)
    .sort(
      (a, b) =>
        Math.abs(a.prix_mad - target.prix_mad) -
        Math.abs(b.prix_mad - target.prix_mad)
    )
    .slice(0, 3);
}