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

Le client peut écrire en français, en arabe, ou en darija (y compris en arabizi : chiffres-lettres comme "3", "7", "9").

Tâche : à partir du message normalisé du client, extraire :
1. L'intention principale (un seul choix parmi la liste fermée du schéma).
2. Les entités mentionnées explicitement (ne jamais inventer une valeur absente du message : laisser null).
3. La langue dominante du message original (fr, ar, ou darija).

Règles strictes :
- N'extrait que ce qui est écrit ou clairement implicite dans le message.
- Si le client mentionne un prix ou une remise en pourcentage, mets-le dans les entités, ne le calcule jamais.
- Si l'intention ne correspond à aucun des cas prévus (facture, réclamation, question hors catalogue), utilise "hors_domaine".
- Une quantité non mentionnée reste null, ne suppose jamais 1 par défaut.`;

export async function extractNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const raw = await structuredExtractor.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: state.normalizedMessage },
  ]);

  // Cast explicite : le schéma valide déjà la forme à l'exécution,
  // seul TypeScript voit deux types "Intent" distincts (souvent dû
  // à withStructuredOutput qui type avant application des .default()).
  return { intent: raw as unknown as Intent };
}