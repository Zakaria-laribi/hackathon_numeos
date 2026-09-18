import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { embedder } from "../../apps/api/src/llm/models.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "raw", "sujet-02-kenza");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

type Chunk = { source: string; content: string };

/** Decoupe un fichier markdown en paragraphes non vides (separes par ligne vide). */
function chunkMarkdown(file: string, sourceLabel: string): Chunk[] {
  const text = readFileSync(join(RAW, file), "utf-8");
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
    .map((content) => ({ source: sourceLabel, content }));
}

type Tour = { role: string; texte: string };
type Conversation = {
  id: string;
  intention: string;
  langue: string;
  difficulte: string;
  ville: string;
  tours: Tour[];
};

/** Un chunk = une conversation complete, avec metadonnees en tete. */
function chunkConversations(): Chunk[] {
  const text = readFileSync(join(RAW, "conversations.jsonl"), "utf-8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const conv: Conversation = JSON.parse(line);
    const dialogue = conv.tours
      .map((t) => `${t.role === "client" ? "Client" : "Agent"}: ${t.texte}`)
      .join("\n");
    const content = `Conversation ${conv.id} (langue: ${conv.langue}, intention: ${conv.intention}, ville: ${conv.ville})\n${dialogue}`;
    return { source: `conversation:${conv.id}`, content };
  });
}

async function alreadyIndexed(): Promise<boolean> {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM rag_chunks");
  return rows[0].n > 0;
}

async function main() {
  if (await alreadyIndexed()) {
    console.log("RAG deja indexe (rag_chunks non vide) -- rien a faire.");
    await pool.end();
    return;
  }

  const chunks: Chunk[] = [
    ...chunkMarkdown("politique-commerciale.md", "politique-commerciale"),
    ...chunkMarkdown("faq-boutique.md", "faq-boutique"),
    ...chunkConversations(),
  ];

  console.log(`Chunks a indexer : ${chunks.length}`);

  // Embeddings calcules en un seul batch (une seule fois, jamais a la requete).
  const vectors = await embedder.embedDocuments(chunks.map((c) => c.content));

  for (let i = 0; i < chunks.length; i++) {
    const vectorLiteral = `[${vectors[i].join(",")}]`;
    await pool.query(
      "INSERT INTO rag_chunks (source, content, embedding) VALUES ($1, $2, $3)",
      [chunks[i].source, chunks[i].content, vectorLiteral]
    );
  }

  console.log(`RAG indexe : ${chunks.length} chunks inseres.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});