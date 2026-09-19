import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

/**
 * GPT-5.5 — agent de relance : decide seul qui relancer, quand, et avec
 * quel message (cahier des charges, architecture agentique attendue).
 */
export const reasoning = new ChatOpenAI({
  model: process.env.LLM_MODEL,
  apiKey: process.env.LLM_API_KEY,
  configuration: { baseURL: process.env.LLM_URL },
});