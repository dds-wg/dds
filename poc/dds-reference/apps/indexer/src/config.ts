import { z } from "zod";

const Schema = z.object({
  INDEXER_PORT: z
    .string()
    .default("8001")
    .transform((s) => Number.parseInt(s, 10)),
  INDEXER_HOST: z.string().default("0.0.0.0"),
  /** SQLite file path (`file:./indexer.db`) or a `postgres://...` URL. SQLite-only for now. */
  INDEXER_DATABASE_URL: z.string().default("file:./indexer.db"),
  INDEXER_JETSTREAM_ENDPOINT: z
    .string()
    .default("wss://jetstream1.us-east.bsky.network/subscribe"),
  /** PDS to read project records from during backfill (DID resolution overrides this when possible). */
  INDEXER_PDS_FALLBACK: z.string().default("https://bsky.social"),
  /** CORS origins for the REST API, JSON array. */
  INDEXER_CORS_ORIGINS: z
    .string()
    .default(
      '["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://127.0.0.1:5173","http://127.0.0.1:5174","http://127.0.0.1:5175"]',
    )
    .transform((s) => z.array(z.string()).parse(JSON.parse(s))),
  INDEXER_LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Config = z.infer<typeof Schema>;

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;
  cached = Schema.parse(process.env);
  return cached;
}
