import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { pool } from "../db/pool.js";
import { embedder } from "../llm/models.js";

const SearchPolicySchema = z.object({
  question: z.string().describe("Question du client sur la politique commerciale ou la FAQ"),
});

/**
 * Recherche vectorielle dans rag_chunks (politique commerciale + FAQ,
 * indexées à l'Étape B). Renvoie les 3 passages les plus proches par
 * similarité cosinus. N'invente aucune politique : si rien de pertinent
 * n'est trouvé, le nœud policy doit escalader plutôt qu'improviser.
 */
export const searchPolicy = tool(
  async ({ question }) => {
    const [queryEmbedding] = await Promise.all([embedder.embedQuery(question)]);
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const { rows } = await pool.query(
      `SELECT source, content, 1 - (embedding <=> $1::vector) AS similarity
       FROM rag_chunks
       ORDER BY embedding <=> $1::vector
       LIMIT 3`,
      [vectorLiteral]
    );

    return JSON.stringify(rows);
  },
  {
    name: "search_policy",
    description: "Recherche les passages les plus pertinents de la politique commerciale et de la FAQ pour répondre à une question générale du client.",
    schema: SearchPolicySchema,
  }
);