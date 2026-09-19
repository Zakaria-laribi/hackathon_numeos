import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import cors from "@fastify/cors";
import { kenzaGraph } from "./agents/graph.js";
import { pool } from "./db/pool.js";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(websocketPlugin);

// --- WebSocket : le simulateur de chat s'y connecte ---
fastify.register(async (instance) => {
  instance.get("/ws/chat/:clientId", { websocket: true }, (socket, req) => {
    const { clientId } = req.params as { clientId: string };
    const config = { configurable: { thread_id: clientId } };

    socket.on("message", async (raw: Buffer) => {
      let rawMessage: string;
      try {
        const parsed = JSON.parse(raw.toString());
        rawMessage = typeof parsed.message === "string" ? parsed.message : raw.toString();
      } catch {
        rawMessage = raw.toString();
      }
      try {
        const result = await kenzaGraph.invoke({ rawMessage, clientId }, config);
        socket.send(
          JSON.stringify({
            reply: result.reply,
            intent: result.intent ?? null,
            toolResult: result.toolResult ?? null,
            escalation: result.escalation ?? null,
          })
        );
      } catch (err) {
        instance.log.error(err);
        socket.send(JSON.stringify({ reply: "Erreur interne, reessayez.", error: true }));
      }
    });
  });
});

// --- REST : donnees pour le dashboard (EX-07) ---

fastify.get("/api/conversations", async () => {
  const { rows } = await pool.query(
    `SELECT c.id, c.thread_id, c.customer_id, c.started_at,
            (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS dernier_message,
            (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id) AS nb_messages,
            EXISTS (SELECT 1 FROM escalations e WHERE e.conversation_id = c.id AND e.statut = 'open') AS escalade_ouverte
     FROM conversations c
     ORDER BY c.started_at DESC
     LIMIT 50`
  );
  return rows;
});

fastify.get("/api/conversations/:id/messages", async (req) => {
  const { id } = req.params as { id: string };
  const { rows } = await pool.query(
    "SELECT role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY id",
    [id]
  );
  return rows;
});

fastify.get("/api/escalations", async () => {
  const { rows } = await pool.query(
    `SELECT e.id, e.conversation_id, e.reason, e.statut, e.created_at, c.thread_id, c.customer_id
     FROM escalations e
     JOIN conversations c ON c.id = e.conversation_id
     WHERE e.statut = 'open'
     ORDER BY e.created_at DESC`
  );
  return rows;
});

fastify.get("/api/orders", async () => {
  const { rows } = await pool.query(
    "SELECT id, customer_id, statut, total_mad, ville_livraison, created_at FROM orders WHERE id ~ '^CMD-[0-9]{13}$' ORDER BY created_at DESC LIMIT 50"
  );
  return rows;
});

fastify.get("/api/stats", async () => {
  const [{ rows: convRows }, { rows: orderRows }] = await Promise.all([
    pool.query("SELECT count(*)::int AS n FROM conversations"),
    pool.query(
      "SELECT count(*)::int AS n, coalesce(sum(total_mad),0)::float AS total FROM orders WHERE id ~ '^CMD-[0-9]{13}$'"
    ),
  ]);
  const conversations = convRows[0].n;
  const commandes = orderRows[0].n;
  const ventes_total_mad = orderRows[0].total;
  const taux_conversion = conversations > 0 ? Number((commandes / conversations).toFixed(3)) : 0;
  return { conversations, commandes, ventes_total_mad, taux_conversion };
});

const port = Number(process.env.PORT ?? 3000);
try {
  await fastify.listen({ host: "0.0.0.0", port });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}