import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { runRelanceCheck } from "./relance.js";

const QUEUE_NAME = "relances";

// BullMQ recommande des connexions separees pour Queue et Worker : le
// Worker utilise des commandes bloquantes (BRPOPLPUSH) qui, sur une
// connexion partagee, empechent toute autre commande (comme
// upsertJobScheduler) de s'executer -- c'est ce qui bloquait le demarrage.
const queueConnection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
const workerConnection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export const relanceQueue = new Queue(QUEUE_NAME, { connection: queueConnection });

new Worker(
  QUEUE_NAME,
  async () => {
    const sent = await runRelanceCheck();
    console.log(`[worker] verification relances terminee, ${sent} message(s) envoye(s).`);
  },
  { connection: workerConnection }
);

// L'agent decide seul QUAND verifier : planification autonome, pas un
// setTimeout dans l'API (qui disparaitrait au redemarrage).
await relanceQueue.upsertJobScheduler(
  "check-abandoned-carts",
  { every: 60_000 },
  { name: "check-abandoned-carts" }
);

console.log("[worker] file de relances demarree (verification toutes les 60s).");