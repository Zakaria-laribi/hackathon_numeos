import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";
import { checkAvailability } from "../engines/stock.js";
import type { Product } from "../engines/types.js";

const CheckStockSchema = z.object({
  ref: z.string().describe("Référence produit, ex: REF-0001"),
});

/**
 * Vérifie la disponibilité d'un produit. Si rupture, propose des
 * alternatives réellement en stock. N'expose jamais delai_reassort_jours.
 */
export const checkStock = tool(
  async ({ ref }) => {
    const { rows } = await pool.query<Product>(
      `SELECT ref, modele, famille, genre, couleur, taille, matiere, saison, prix_mad, stock
       FROM products`
    );
    const decision = checkAvailability(ref, rows);
    return JSON.stringify(decision);
  },
  {
    name: "check_stock",
    description: "Vérifie si un produit est en stock. Renvoie des alternatives si en rupture, ou une escalade si la référence n'existe pas.",
    schema: CheckStockSchema,
  }
);