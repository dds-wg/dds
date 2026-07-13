import { defineConfig } from "drizzle-kit";

const url = process.env.INDEXER_DATABASE_URL ?? "file:./indexer.db";

const dialect = url.startsWith("postgres") ? "postgresql" : "sqlite";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: dialect === "postgresql" ? { url } : { url: url.replace(/^file:/, "") },
});
