import { normalizeDarija } from "../../lang/normalize.js";
import type { KenzaStateType } from "../state.js";

/**
 * Noeud d'entree du graphe. Normalise l'ecriture (arabizi -> arabe,
 * unification des graphies) pour que extract et le RAG comparent
 * des formes canoniques, pas des variantes orthographiques.
 * Ne touche JAMAIS rawMessage : c'est l'original affiche dans la trace.
 *
 * Reinitialise aussi escalation et toolResult : ce sont des donnees
 * d'UN SEUL tour de conversation. Sans ce reset, le checkpointer (Etape G)
 * restaure l'etat complet du tour precedent, et une ancienne escalade
 * reste "collee" a tous les messages suivants du meme client, meme
 * legitimes. cart n'est volontairement PAS reinitialise : lui doit
 * persister d'un message a l'autre (EX-04).
 */
export async function ingestNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  const normalizedMessage = normalizeDarija(state.rawMessage);
  return { normalizedMessage, escalation: null, toolResult: null };
}