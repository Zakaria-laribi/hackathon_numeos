import { pool } from "./db/pool.js";
import { reasoning } from "./llm/models.js";

const DELAY_MINUTES = Number(process.env.RELANCE_DELAY_MINUTES ?? 30);

interface AbandonedCart {
  id: number;
  customer_id: string;
  langue_preferee: string | null;
  lignes: { ref: string; quantite: number }[];
}

/** Paniers ouverts, inactifs depuis DELAY_MINUTES, jamais relances. */
async function findAbandonedCarts(): Promise<AbandonedCart[]> {
  const { rows } = await pool.query(
    `SELECT c.id, c.customer_id, cu.langue_preferee, c.lignes
     FROM carts c
     JOIN customers cu ON cu.client_id = c.customer_id
     WHERE c.statut = 'open'
       AND c.relance_envoyee_at IS NULL
       AND c.updated_at < now() - ($1 || ' minutes')::interval
       AND jsonb_array_length(coalesce(c.lignes, '[]'::jsonb)) > 0`,
    [DELAY_MINUTES]
  );
  return rows;
}

/** L'agent redige lui-meme le message, a partir des vrais articles du panier. */
async function composeRelanceMessage(cart: AbandonedCart): Promise<string> {
  const refs = cart.lignes.map((l) => l.ref);
  const { rows: products } = await pool.query(
    `SELECT ref, modele, couleur FROM products WHERE ref = ANY($1)`,
    [refs]
  );
  const items = products.map((p) => `${p.modele} (${p.couleur})`).join(", ");
  const langue = cart.langue_preferee ?? "fr";

  const styleInstruction =
    langue === "darija"
      ? "darija (alphabet latin uniquement, vocabulaire simple : 'Safi', 'Bghiti', 'Kayn', jamais de mot religieux ni d'alphabet arabe mélangé)"
      : langue === "ar"
      ? "arabe"
      : "français";

  const response = await reasoning.invoke([
    {
      role: "system",
      content: `Tu es l'agent de relance d'un commerce WhatsApp au Maroc.
Un client a laisse un panier sans finaliser sa commande. Redige UN SEUL
message court, chaleureux, sans pression commerciale excessive, pour le
lui rappeler et l'inviter a finaliser. N'invente AUCUN prix ni delai de
livraison. Reponds uniquement en ${styleInstruction}.`,
    },
    {
      role: "user",
      content: `Articles laisses dans le panier : ${items}. Redige le message de relance.`,
    },
  ]);
  return response.content as string;
}

/** Verifie les paniers abandonnes, envoie (= enregistre) une relance pour chacun. */
export async function runRelanceCheck(): Promise<number> {
  const carts = await findAbandonedCarts();
  let sent = 0;

  for (const cart of carts) {
    const message = await composeRelanceMessage(cart);

    const { rows: convRows } = await pool.query<{ id: number }>(
      `INSERT INTO conversations (customer_id, thread_id)
       VALUES ($1, $1)
       ON CONFLICT (thread_id) DO UPDATE SET thread_id = EXCLUDED.thread_id
       RETURNING id`,
      [cart.customer_id]
    );
    const conversationId = convRows[0].id;

    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'agent', $2)",
      [conversationId, message]
    );

    await pool.query("UPDATE carts SET relance_envoyee_at = now() WHERE id = $1", [cart.id]);

    console.log(`[relance] envoyee a ${cart.customer_id}: ${message}`);
    sent++;
  }

  return sent;
}