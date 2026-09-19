import { checkpointer } from "./checkpointer.js";

async function main() {
  await checkpointer.setup();
  console.log("Tables du checkpointer creees (ou deja existantes).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});