import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";
import { computePrice } from "../engines/pricing.js";
import type { Product, Promotion } from "../engines/types.js";

const OrderLineSchema = z.object({
  ref: z.string(),
  quantite: z.number().int().positive(),
  remise_pct: z.number().min(0).max(100).default(0),
});

const CreateOrderSchema = z.object({
  client_id: z.string().describe("Identifiant client, ex: CLI-0001"),
  lignes: z.array(OrderLineSchema).min(1),
  ville: z.string().describe("Ville de livraison"),
});

/**
 * Crée une commande en base à partir de lignes déjà validées par les
 * moteurs (pricing, stock, delivery). N'invente aucun prix : recalcule
 * chaque ligne via computePrice avant d'écrire.
 */
export const createOrder = tool(
  async ({ client_id, lignes, ville }) => {
    const { rows: catalog } = await pool.query<Product>(
      `SELECT ref, modele, famille, genre, couleur, taille, matiere, saison, prix_mad, stock FROM products`
    );
    const { rows: promotions } = await pool.query<Promotion>(
      `SELECT ref, modele, prix_normal_mad, prix_promo_mad, debut, fin, condition FROM promotions`
    );

    const breakdown = [];
    let total = 0;
    for (const ligne of lignes) {
      const decision = computePrice(ligne.ref, ligne.quantite, catalog, promotions, ligne.remise_pct);
      if (!decision.ok) return JSON.stringify(decision); // escalade, aucune écriture
      breakdown.push(decision.value);
      total += decision.value.total_mad;
    }

    const orderId = `CMD-${Date.now()}`;
    await pool.query(
      `INSERT INTO orders (id, customer_id, date, statut, total_mad, ville_livraison)
       VALUES ($1, $2, CURRENT_DATE, 'nouvelle', $3, $4)`,
      [orderId, client_id, total, ville]
    );
    for (const b of breakdown) {
      const ligne = lignes.find((l) => l.ref === b.ref)!;
      const product = catalog.find((p) => p.ref === b.ref)!;
      await pool.query(
        `INSERT INTO order_lines (order_id, ref, modele, taille, quantite, prix_unitaire_mad)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, b.ref, product.modele, product.taille, ligne.quantite, b.prix_applique_mad]
      );
    }

    // La commande est finalisee : le panier ne doit plus etre relance.
    await pool.query(`UPDATE carts SET statut = 'completed' WHERE customer_id = $1`, [client_id]);

    return JSON.stringify({ ok: true, order_id: orderId, total_mad: total, ville });
    
  },
  {
    name: "create_order",
    description: "Crée une commande en base après validation des prix par le moteur de pricing. N'écrit rien si une ligne est escaladée.",
    schema: CreateOrderSchema,
  }
);