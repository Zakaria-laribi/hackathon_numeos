import { ChatOpenAI, AzureChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Le .env est à la racine du monorepo, pas dans apps/api
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });
/**
 * GPT-5.5 — uniquement là où le raisonnement compte.
 * Routeur d'intention, agent de relance, agent d'escalade.
 */
export const reasoning = new ChatOpenAI({
  model: process.env.LLM_MODEL,
  apiKey: process.env.LLM_API_KEY,
  configuration: { baseURL: process.env.LLM_URL },
});

/**
 * GPT-4.1 (Azure) — extraction, classification, reformulation, rédaction.
 * Tout ce qui ne demande pas de décision à plusieurs étapes.
 */
export const fast = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  maxTokens: Number(process.env.AZURE_OPENAI_MAX_TOKENS ?? 16384),
  temperature: 0,
});

/**
 * Embeddings — calculés UNE SEULE FOIS au seed, jamais à la requête.
 */
export const embedder = new OpenAIEmbeddings({
  model: process.env.EMBEDDING_MODEL,
  apiKey: process.env.LLM_API_KEY,
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 512),
  configuration: { baseURL: process.env.LLM_URL },
});