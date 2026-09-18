import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";
import { quoteDelivery } from "../engines/delivery.js";
import type { DeliveryRule } from "../engines/types.js";

const ComputeDeliverySchema = z.object({
  ville: z.string().describe("Ville de livraison, ex: Fès"),
});

/**
 * Calcule frais et délai de livraison pour une ville.
 * Escalade si la ville est absente de la grille (jamais d'estimation).
 */
export const computeDelivery = tool(
  async ({ ville }) => {
    const { rows } = await pool.query<DeliveryRule>(
      `SELECT ville, frais_mad, delai_heures, paiement_a_la_livraison, retrait_boutique
       FROM delivery_grid`
    );
    const decision = quoteDelivery(ville, rows);
    return JSON.stringify(decision);
  },
  {
    name: "compute_delivery",
    description: "Calcule les frais et le délai de livraison pour une ville. Escalade si la ville est absente de la grille.",
    schema: ComputeDeliverySchema,
  }
);