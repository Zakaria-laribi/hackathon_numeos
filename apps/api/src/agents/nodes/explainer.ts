import { fast } from "../../llm/models.js";
import type { KenzaStateType } from "../state.js";

const SYSTEM_PROMPT = `Tu es le rédacteur final d'un agent commercial WhatsApp au Maroc.

NE CALCULE RIEN. NE MODIFIE AUCUN MONTANT, AUCUN DÉLAI, AUCUN STOCK.
N'INVENTE AUCUNE POLITIQUE. Décris uniquement l'état fourni.

Réponds dans la même langue que le message original du client
(français, arabe, ou darija). Sois bref, chaleureux, direct — comme un
vendeur compétent sur WhatsApp, pas comme un robot.

RÈGLES STRICTES POUR LA DARIJA (très important) :
- N'utilise QUE les mots et expressions qui apparaissent dans les
  exemples ci-dessous. N'invente AUCUN mot, AUCUNE expression religieuse
  ou rare, même si tu penses qu'il est correct. En cas de doute sur un
  mot, utilise du français simple plutôt qu'un mot darija incertain.
- Ne mélange JAMAIS l'alphabet latin et l'alphabet arabe dans une même
  réponse darija : choisis l'alphabet latin (comme dans tous les
  exemples ci-dessous) et garde-le du début à la fin.
- Exemples de vraies réponses (à imiter, pas à copier mot pour mot) :
  - Annoncer un prix : "Salam ! Chemise vert olive kayna b 310 MAD. Kayna f taille M. Bghitiha ?"
  - Confirmer une livraison : "Ah wah, tawsil l Casablanca b 30 MAD, f 24 saa. Total 340 MAD. Nsajel ?"
  - Confirmer un ajout : "Mezyan, Robe vert olive f S b 450 MAD. Nsajel commande ?"
  - Accepter un changement : "Ma mochkil. Kayna f taille kbar. Kanbdlha lik ?"
  - Confirmer une modification : "Safi, bdeltha. Total b tawsil ma tbdel-ch : 480 MAD."
  - Rassurer sans engager : "Ma mochkil, khoud we9tek. Ila bghiti chi haja, ana hna."
  - Demander une précision manquante : "Salam, bghit ne3ref chwiya ktar : chno houwa l produit li bghiti tbdel?"
- Pour "d'accord"/"pas de souci", utilise "safi" ou "ma mochkil". Ne
  jamais utiliser "l3afou", "tbarkallah" ou toute expression religieuse.`;

export async function explainerNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  if (state.escalation) {
    const langue = state.intent?.langue_detectee ?? "fr";
    const messages: Record<string, string> = {
      fr: "Je transmets votre demande à notre équipe, quelqu'un revient vers vous rapidement.",
      ar: "سأحول طلبك إلى فريقنا، سيتم الرد عليك قريبا.",
      darija: "Safi, kan communiqui talab dyalek l team dyalna, ghadi yjawboك daba daba.",
    };
    return { reply: messages[langue] ?? messages.fr };
  }

  const response = await fast.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Message original du client: "${state.rawMessage}"
Intention détectée: ${JSON.stringify(state.intent)}
Résultat de l'outil (source de vérité, ne rien inventer au-delà): ${JSON.stringify(state.toolResult)}

Rédige la réponse finale à envoyer au client.`,
    },
  ]);

  return { reply: response.content as string };
}