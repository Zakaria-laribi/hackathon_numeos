import { searchPolicy } from "../../tools/index.js";
import type { KenzaStateType } from "../state.js";

/**
 * Agent Politique : interroge le RAG (rag_chunks, Étape B) plutôt que
 * d'inventer une réponse. Un seuil de similarité minimal évite de
 * répondre à côté avec un passage non pertinent — en dessous, on
 * escalade plutôt que d'improviser.
 */
const SIMILARITY_THRESHOLD = 0.5;

export async function policyNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const question = state.normalizedMessage || state.rawMessage;

  const raw = await searchPolicy.invoke({ question });
  const results: Array<{ source: string; content: string; similarity: number }> = JSON.parse(raw);

  if (results.length === 0 || results[0].similarity < SIMILARITY_THRESHOLD) {
    return {
      toolResult: { agent: "policy", ok: false, results },
      escalation: { reason: "policy: aucun passage suffisamment pertinent trouvé dans la politique commerciale" },
    };
  }

  return {
    toolResult: { agent: "policy", ok: true, passages: results },
  };
}