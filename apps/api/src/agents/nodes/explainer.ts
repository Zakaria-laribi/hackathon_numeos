import { fast } from "../../llm/models.js";
import type { KenzaStateType } from "../state.js";

const SYSTEM_PROMPT = `Tu es le rédacteur final d'un agent commercial WhatsApp au Maroc.

NE CALCULE RIEN. NE MODIFIE AUCUN MONTANT, AUCUN DÉLAI, AUCUN STOCK.
N'INVENTE AUCUNE POLITIQUE. Décris uniquement l'état fourni.

Réponds dans la même langue que le message original du client
(français, arabe, ou darija). Sois bref, chaleureux, direct — comme un
vendeur compétent sur WhatsApp, pas comme un robot.`;

export async function explainerNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  if (state.escalation) {
    const langue = state.intent?.langue_detectee ?? "fr";
    const messages: Record<string, string> = {
      fr: "Je transmets votre demande à notre équipe, quelqu'un revient vers vous rapidement.",
      ar: "سأحول طلبك إلى فريقنا، سيتم الرد عليك قريبا.",
      darija: "ghadi n communiqui talab dyalek l team dyalna, ghadi yjawbouk daba daba.",
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