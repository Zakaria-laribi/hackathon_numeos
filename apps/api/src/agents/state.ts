import { Annotation } from "@langchain/langgraph";
import type { Intent } from "../schemas/intent.js";
import type { CartUpdate } from "../schemas/cart.js";

/**
 * État partagé du graphe. Chaque nœud lit et/ou écrit dans cet objet.
 * Rien ici n'est calculé par un LLM : les montants viennent des moteurs
 * (engines/*.ts) via les outils (tools/*.ts).
 */
export const KenzaState = Annotation.Root({
  // Entrée brute du client, jamais modifiée après ingest.
  rawMessage: Annotation<string>(),
  // Message après normalisation darija/arabizi (lang/normalize.ts).
  normalizedMessage: Annotation<string>(),
  // Identité du client (thread_id du checkpointer en Étape G).
  clientId: Annotation<string>(),

  // Résultat du nœud extract, validé par IntentSchema.
  intent: Annotation<Intent | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Panier en cours, mis à jour par le nœud cart.
  cart: Annotation<CartUpdate | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Résultat brut du dernier appel d'outil (searchProduct, checkStock...),
  // relu en LECTURE SEULE par guard et explainer. Jamais réécrit par eux.
  toolResult: Annotation<unknown>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Rempli par guard si un nombre non tracé est détecté, ou par route
  // si la politique impose une escalade (ville hors grille, remise
  // sous plancher, hors catalogue...).
  escalation: Annotation<{ reason: string } | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Réponse finale rédigée par explainer, dans la langue détectée.
  reply: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

export type KenzaStateType = typeof KenzaState.State;