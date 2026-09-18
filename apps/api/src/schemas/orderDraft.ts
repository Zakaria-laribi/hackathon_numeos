import { z } from "zod";
import { CartLineSchema } from "./cart.js";

/**
 * Forme validée juste avant l'appel à l'outil createOrder.
 * Si cette validation échoue, escalade — jamais de commande
 * créée à moitié ou avec des données devinées.
 */
export const OrderDraftSchema = z.object({
  client_id: z.string(),
  ville: z.string(),
  lignes: z.array(CartLineSchema).min(1),
  remise_pct: z.number().min(0).max(100).default(0),
});

export type OrderDraft = z.infer<typeof OrderDraftSchema>;