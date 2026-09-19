import { fast } from "../../llm/models.js";
import { IntentSchema } from "../../schemas/intent.js";
import type { KenzaStateType } from "../state.js";
import type { Intent } from "../../schemas/intent.js";

/**
 * Modèle contraint à produire une sortie conforme à IntentSchema.
 * Toute réponse hors schéma est rejetée par LangChain, jamais
 * réinterprétée côté agent.
 */
const structuredExtractor = fast.withStructuredOutput(IntentSchema, {
  name: "extract_intent",
});

const SYSTEM_PROMPT = `Tu es le module d'extraction d'intention d'un agent commercial WhatsApp au Maroc.

Le client peut écrire en français, en arabe, ou en darija (y compris en arabizi : chiffres-lettres comme "3", "7","9").

Tâche : à partir du message normalisé du client, extraire :
1. L'intention principale (un seul choix parmi la liste fermée du schéma).
2. Les entités mentionnées explicitement (ne jamais inventer une valeur absente du message : laisser null).
3. La langue dominante du message original (fr, ar, ou darija).

Règles strictes :
- N'extrait que ce qui est écrit ou clairement implicite dans le message.
- Si le client mentionne un prix ou une remise en pourcentage, mets-le dans les entités, ne le calcule jamais.
- Utilise "question_politique" pour toute question générale sur les conditions
  de vente : retour, garantie, délai de remboursement, moyens de paiement,
  politique de la boutique en général (pas une question de prix ou de stock
  sur un produit précis).
- Si l'intention ne correspond à aucun des cas prévus (facture au nom d'une
  société, réclamation, litige, question totalement hors sujet), utilise
  "hors_domaine".
- Une quantité non mentionnée reste null, ne suppose jamais 1 par défaut.`;

// Une confirmation courte ("oui", "wakha", "sejelha"...) n'a par définition
// aucune entité à extraire — inutile et peu fiable de demander au LLM de
// deviner. Si un panier existe déjà, on la traite directement comme
// "creer_commande" sans appel modèle.
const CONFIRMATION_PATTERN =
  /^(oui+|ok(ay)?|wakha|safi|iwa|d'?accord|c'est bon|allez-y|go|sejel(ha)?|confirm(e|é)?)\.?!?$/i;

export async function extractNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const trimmed = state.normalizedMessage.trim();
  const cartHasItems = (state.cart?.lignes.length ?? 0) > 0;

  if (cartHasItems && CONFIRMATION_PATTERN.test(trimmed)) {
    return {
      intent: {
        intention: "creer_commande",
        entites: {
          ref: null, modele: null, couleur: null, taille: null,
          ville: null, quantite: null, remise_demandee_pct: null,
        },
        langue_detectee: state.intent?.langue_detectee ?? "fr",
      },
    };
  }

  // Sans ce contexte, le LLM ne sait pas qu'une commande est en attente
  // d'une seule information — "Fès" tout seul lui semble hors sujet.
  const contextNote =
    cartHasItems && !state.cart?.ville
      ? `\n\nContexte important : une commande est en cours de finalisation pour ce client, il ne manque QUE la ville de livraison. Si le message du client est juste un nom de ville (ex: "Fès", "Casablanca", "Rabat"), classe-le comme "creer_commande" avec entites.ville renseignée — ce n'est PAS hors domaine.`
      : "";

  const raw = await structuredExtractor.invoke([
    { role: "system", content: SYSTEM_PROMPT + contextNote },
    { role: "user", content: state.normalizedMessage },
  ]);

  return { intent: raw as unknown as Intent };
}