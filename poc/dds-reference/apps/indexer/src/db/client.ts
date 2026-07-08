import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

import * as schema from "./schema.js";
import { getConfig } from "../config.js";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (db) return db;
  const cfg = getConfig();
  if (cfg.INDEXER_DATABASE_URL.startsWith("postgres")) {
    throw new Error(
      "Indexer's Postgres support isn't wired up yet; set INDEXER_DATABASE_URL=file:./path/to.db",
    );
  }
  const path = cfg.INDEXER_DATABASE_URL.replace(/^file:/, "");
  mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle({ client: sqlite, schema });
  return db;
}

export async function runMigrations(): Promise<void> {
  const d = getDb();
  const here = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = resolve(here, "..", "..", "drizzle");
  migrate(d, { migrationsFolder });
}

export { schema };
