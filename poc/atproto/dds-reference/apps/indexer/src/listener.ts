/**
 * Live jetstream listener. Subscribes to the DDS collections and writes every `create`/`update`
 * commit into the `records` table.
 */
import { Jetstream } from "@skyware/jetstream";
import { COLLECTIONS } from "@dds/client";
import { sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";

import { getConfig } from "./config.js";
import { getDb } from "./db/client.js";
import { records } from "./db/schema.js";
import { toRecordRow } from "./extract.js";

export interface Listener {
  readonly stream: Jetstream;
  start(): void;
  close(): void;
}

export function startListener(log: FastifyBaseLogger): Listener {
  const cfg = getConfig();
  const db = getDb();

  const stream = new Jetstream({
    endpoint: cfg.INDEXER_JETSTREAM_ENDPOINT,
    wantedCollections: Object.values(COLLECTIONS),
  });

  stream.on("commit", (event) => {
    const commit = event.commit;
    if (commit.operation !== "create" && commit.operation !== "update") return;
    const rec = (commit as { record?: unknown }).record;
    if (!rec || typeof rec !== "object") return;
    const row = toRecordRow({
      uri: `at://${event.did}/${commit.collection}/${commit.rkey}`,
      cid: (commit as { cid?: string }).cid ?? "",
      did: event.did,
      collection: commit.collection,
      rkey: commit.rkey,
      eventTimeMs: event.time_us / 1000,
      record: rec as Record<string, unknown>,
    });
    try {
      db.insert(records)
        .values(row)
        .onConflictDoUpdate({
          target: records.uri,
          set: {
            cid: row.cid,
            value: row.value,
            recordCreatedAtMs: row.recordCreatedAtMs,
            indexedAtMs: sql`excluded.indexed_at_ms`,
            projectUri: row.projectUri,
            phase: row.phase,
            targetUri: row.targetUri,
            subjectUri: row.subjectUri,
          },
        })
        .run();
    } catch (err) {
      log.warn({ err, uri: row.uri }, "indexer: failed to upsert record");
    }
  });

  stream.on("error", (err) => {
    log.error({ err }, "jetstream error");
  });

  stream.on("open", () => log.info({ endpoint: cfg.INDEXER_JETSTREAM_ENDPOINT }, "jetstream connected"));
  stream.on("close", () => log.warn("jetstream disconnected"));

  return {
    stream,
    start: () => stream.start(),
    close: () => stream.close(),
  };
}
