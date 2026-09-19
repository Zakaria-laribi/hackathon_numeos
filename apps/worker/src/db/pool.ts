import { Pool } from "pg";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

/** Pool Postgres unique, partage par le worker. */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});