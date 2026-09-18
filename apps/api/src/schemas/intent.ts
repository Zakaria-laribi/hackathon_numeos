import { z } from "zod";

/**
 * Ce que le nœud `extract` (GPT-4.1) doit renvoyer, et RIEN d'autre.
 * Toute réponse hors de cette forme est une erreur de validation,
 * jamais une supposition côté agent.
 */
export const IntentSchema = z.object({
  intention: z.enum([
    "recherche_produit",
    "verifier_stock",
    "demande_prix",
    "calcul_livraison",
    "mise_a_jour_panier",
    "demande_remise",
    "creer_commande",
    "consulter_historique",
    "hors_domaine",
  ]),
  entites: z.object({
    ref: z.string().nullable().default(null),
    modele: z.string().nullable().default(null),
    couleur: z.string().nullable().default(null),
    taille: z.string().nullable().default(null),
    ville: z.string().nullable().default(null),
    quantite: z.number().int().positive().nullable().default(null),
    remise_demandee_pct: z.number().nullable().default(null),
  }),
  langue_detectee: z.enum(["fr", "ar", "darija"]),
});

export type Intent = z.infer<typeof IntentSchema>;