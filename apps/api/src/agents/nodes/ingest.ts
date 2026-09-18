import { normalizeDarija } from "../../lang/normalize.js";
import type { KenzaStateType } from "../state.js";

/**
 * Nœud d'entrée du graphe. Normalise l'écriture (arabizi → arabe,
 * unification des graphies) pour que `extract` et le RAG comparent
 * des formes canoniques, pas des variantes orthographiques.
 * Ne touche JAMAIS rawMessage : c'est l'original affiché dans la trace.
 */
export async function ingestNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const normalizedMessage = normalizeDarija(state.rawMessage);
  return { normalizedMessage };
}