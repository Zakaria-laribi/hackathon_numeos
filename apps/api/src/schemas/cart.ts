import { z } from "zod";

/**
 * Ce que le nœud `cart` doit renvoyer après mise à jour du panier.
 * Ne recalcule rien lui-même : les montants viennent des moteurs
 * (engines/pricing.ts, engines/delivery.ts), jamais du LLM.
 */
export const CartLineSchema = z.object({
  ref: z.string(),
  quantite: z.number().int().positive(),
});

export const CartUpdateSchema = z.object({
  client_id: z.string(),
  ville: z.string().nullable().default(null),
  lignes: z.array(CartLineSchema),
  action: z.enum(["ajout", "modification", "suppression", "vidage"]),
});

export type CartUpdate = z.infer<typeof CartUpdateSchema>;