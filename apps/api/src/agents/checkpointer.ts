import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

/**
 * Checkpointer Postgres partagé. thread_id = clientId lors de l'invoke,
 * ce qui permet à kenzaGraph de restaurer automatiquement cart, intent,
 * etc. d'un message à l'autre pour un même client (EX-04).
 */
export const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);