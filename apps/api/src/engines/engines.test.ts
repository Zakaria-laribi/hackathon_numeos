import { describe, it, expect } from "vitest";
import { applyDiscount } from "./discount.js";
import { quoteDelivery, canPayOnDelivery } from "./delivery.js";
import { checkAvailability } from "./stock.js";
import { computePrice } from "./pricing.js";
import type { Product, DeliveryRule, Promotion } from "./types.js";

const catalog: Product[] = [
  { ref: "REF-0001", modele: "Foulard bordeaux", famille: "Foulard", genre: "femme",
    couleur: "bordeaux", taille: "unique", matiere: "cuir", saison: "toute saison",
    prix_mad: 100, stock: 2 },
  { ref: "REF-0099", modele: "Foulard noir", famille: "Foulard", genre: "femme",
    couleur: "noir", taille: "unique", matiere: "soie", saison: "toute saison",
    prix_mad: 120, stock: 0 },
  { ref: "REF-0074", modele: "Pantalon camel", famille: "Pantalon", genre: "mixte",
    couleur: "camel", taille: "40", matiere: "coton", saison: "toute saison",
    prix_mad: 300, stock: 5 },
];

const grid: DeliveryRule[] = [
  { ville: "Fès", frais_mad: 35, delai_heures: 24,
    paiement_a_la_livraison: false, retrait_boutique: true },
  { ville: "Casablanca", frais_mad: 25, delai_heures: 72,
    paiement_a_la_livraison: true, retrait_boutique: true },
];

const promotions: Promotion[] = [
  { ref: "REF-0074", modele: "Pantalon camel", prix_normal_mad: 300,
    prix_promo_mad: 240, debut: "2026-09-01", fin: "2026-09-30",
    condition: "dans la limite des stocks disponibles" },
];

const during = new Date("2026-09-17");
const after = new Date("2026-10-05");

describe("plancher de remise", () => {
  it("accepte une remise dans le plancher", () => {
    const r = applyDiscount(1000, 10);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.priceMad).toBe(900);
  });

  it("escalade au-delà du plancher", () => {
    const r = applyDiscount(1000, 30);
    expect(r.ok).toBe(false);
  });

  it("escalade même sur un dépassement minime", () => {
    expect(applyDiscount(1000, 10.5).ok).toBe(false);
  });
});

describe("livraison", () => {
  it("trouve la ville malgré accents et casse", () => {
    const r = quoteDelivery("fes", grid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.frais_mad).toBe(35);
  });

  it("escalade sur une ville hors grille, sans estimer", () => {
    const r = quoteDelivery("Ouarzazate", grid);
    expect(r.ok).toBe(false);
  });

  it("refuse le paiement à la livraison là où la grille l'interdit", () => {
    const r = canPayOnDelivery("Fès", grid);
    expect(r.ok && r.value).toBe(false);
  });
});

describe("stock", () => {
  it("propose des alternatives réellement disponibles", () => {
    const r = checkAvailability("REF-0099", catalog);
    expect(r.ok).toBe(true);
    if (r.ok && r.value.status === "out_of_stock") {
      expect(r.value.alternatives.length).toBeGreaterThan(0);
      expect(r.value.alternatives.every((p) => p.stock > 0)).toBe(true);
    }
  });

  it("n'expose jamais de délai de réassort", () => {
    const r = checkAvailability("REF-0099", catalog);
    expect(JSON.stringify(r)).not.toContain("reassort");
  });

  it("escalade sur une référence hors catalogue", () => {
    expect(checkAvailability("REF-9999", catalog).ok).toBe(false);
  });
});

describe("prix", () => {
  it("applique la promotion pendant sa période", () => {
    const r = computePrice("REF-0074", 1, catalog, promotions, 0, during);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.prix_applique_mad).toBe(240);
      expect(r.value.promotion_active).toBe(true);
    }
  });

  it("revient au prix catalogue après expiration", () => {
    const r = computePrice("REF-0074", 1, catalog, promotions, 0, after);
    if (r.ok) expect(r.value.prix_applique_mad).toBe(300);
  });

  it("escalade si on négocie sous le plancher, promo comprise", () => {
    expect(computePrice("REF-0074", 1, catalog, promotions, 25, during).ok).toBe(false);
  });

  it("n'annonce aucun prix hors catalogue", () => {
    expect(computePrice("REF-9999", 1, catalog, promotions, 0, during).ok).toBe(false);
  });
});
