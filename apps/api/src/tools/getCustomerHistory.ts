import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";

const GetCustomerHistorySchema = z.object({
  client_id: z.string().describe("Identifiant client, ex: CLI-0001"),
});

/**
 * Renvoie les commandes précédentes d'un client.
 * Sert de base à EX-04 : ne jamais redemander une info déjà connue.
 */
export const getCustomerHistory = tool(
  async ({ client_id }) => {
    const { rows } = await pool.query(
      `SELECT o.id, o.date, o.statut, o.total_mad,
              json_agg(json_build_object('ref', ol.ref, 'quantite', ol.quantite)) AS lignes
       FROM orders o
       JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id, o.date, o.statut, o.total_mad
       ORDER BY o.date DESC
       LIMIT 5`,
      [client_id]
    );
    return JSON.stringify(rows);
  },
  {
    name: "get_customer_history",
    description: "Renvoie les 5 dernières commandes d'un client pour éviter de lui redemander des informations déjà connues.",
    schema: GetCustomerHistorySchema,
  }
);