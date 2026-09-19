import { pool } from "../../db/pool.js";
import type { KenzaStateType } from "../state.js";

/**
 * Persistance reelle de la trace de conversation. thread_id = clientId
 * (Etape G), donc une ligne "conversations" par client, retrouvee (pas
 * recreee) a chaque nouveau message du meme client.
 */
export async function persistNode(
  state: KenzaStateType
): Promise<Partial<KenzaStateType>> {
  console.log("[persist]", {
    clientId: state.clientId,
    intention: state.intent?.intention,
    escalation: state.escalation,
    reply: state.reply,
  });

  // Un client qui ecrit peut ne pas exister encore dans customers
  // (nouveau contact WhatsApp) : on cree une fiche minimale plutot que
  // de faire echouer la contrainte de cle etrangere.
  await pool.query(
    "INSERT INTO customers (client_id) VALUES ($1) ON CONFLICT (client_id) DO NOTHING",
    [state.clientId]
  );

  // Retrouver ou creer la conversation pour ce client.
  const convResult = await pool.query<{ id: number }>(
    `INSERT INTO conversations (customer_id, thread_id)
     VALUES ($1, $1)
     ON CONFLICT (thread_id) DO UPDATE SET thread_id = EXCLUDED.thread_id
     RETURNING id`,
    [state.clientId]
  );
  const conversationId = convResult.rows[0].id;

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'client', $2)",
    [conversationId, state.rawMessage]
  );

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'agent', $2)",
    [conversationId, state.reply]
  );

  if (state.escalation) {
    await pool.query(
      "INSERT INTO escalations (conversation_id, reason, contexte) VALUES ($1, $2, $3)",
      [
        conversationId,
        state.escalation.reason,
        JSON.stringify({ intent: state.intent, toolResult: state.toolResult }),
      ]
    );
  }

  return {};
}