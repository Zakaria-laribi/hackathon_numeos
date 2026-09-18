import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";
import type { Product } from "../engines/types.js";

const SearchProductSchema = z.object({
  query: z.string().describe("Terme de recherche : modèle, famille, couleur..."),
  famille: z.string().optional().describe("Filtrer par famille (ex: Foulard, Sac à main)"),
  couleur: z.string().optional().describe("Filtrer par couleur"),
  genre: z.string().optional().describe("Filtrer par genre (femme, homme, mixte)"),
});

/**
 * Recherche des produits dans le catalogue.
 * Ne renvoie JAMAIS delai_reassort_jours (politique commerciale).
 */
export const searchProduct = tool(
  async ({ query, famille, couleur, genre }) => {
    const conditions: string[] = ["(modele ILIKE $1 OR famille ILIKE $1)"];
    const params: unknown[] = [`%${query}%`];

    if (famille) { params.push(famille); conditions.push(`famille ILIKE $${params.length}`); }
    if (couleur) { params.push(couleur); conditions.push(`couleur ILIKE $${params.length}`); }
    if (genre) { params.push(genre); conditions.push(`genre ILIKE $${params.length}`); }

    const sql = `
      SELECT ref, modele, famille, genre, couleur, taille, matiere, saison, prix_mad, stock
      FROM products
      WHERE ${conditions.join(" AND ")}
      LIMIT 10
    `;
    const { rows } = await pool.query<Product>(sql, params);
    return JSON.stringify(rows);
  },
  {
    name: "search_product",
    description: "Recherche des produits dans le catalogue par mot-clé, famille, couleur ou genre.",
    schema: SearchProductSchema,
  }
);