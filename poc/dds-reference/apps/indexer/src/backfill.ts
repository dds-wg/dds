/**
 * One-shot project backfill via jetstream replay.
 *
 * Uses the generic `replay_from_cursor` style: we resolve the project's createdAt cursor and
 * iterate jetstream events from there until caught up to "now". Each event whose `step.project.uri`
 * matches the target project is upserted into `records`.
 *
 * Idempotent: re-running a backfill won't duplicate rows. State is tracked in `project_backfills`.
 */
import { resolveProjectCursor, subscribe, COLLECTIONS } from "@dds/client";
import { eq, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";

import { getConfig } from "./config.js";
import { getDb } from "./db/client.js";
import { projectBackfills, records } from "./db/schema.js";
import { toRecordRow } from "./extract.js";

const CATCHUP_GRACE_SECONDS = 2;

export interface BackfillStatus {
  projectUri: string;
  status: "pending" | "running" | "done" | "error";
  startedAtMs: number | null;
  completedAtMs: number | null;
  recordsAdded: number;
  error: string | null;
}

export function getBackfillStatus(projectUri: string): BackfillStatus | null {
  const row = getDb()
    .select()
    .from(projectBackfills)
    .where(eq(projectBackfills.projectUri, projectUri))
    .get();
  if (!row) return null;
  return {
    projectUri: row.projectUri,
    status: row.status as BackfillStatus["status"],
    startedAtMs: row.startedAtMs,
    completedAtMs: row.completedAtMs,
    recordsAdded: row.recordsAdded,
    error: row.error,
  };
}

export async function backfillProject(
  projectUri: string,
  log: FastifyBaseLogger,
): Promise<BackfillStatus> {
  const cfg = getConfig();
  const db = getDb();

  // Mark pending immediately, then transition to running once we have a cursor.
  db.insert(projectBackfills)
    .values({
      projectUri,
      status: "pending",
      recordsAdded: 0,
    })
    .onConflictDoUpdate({
      target: projectBackfills.projectUri,
      set: {
        status: "pending",
        startedAtMs: null,
        completedAtMs: null,
        error: null,
      },
    })
    .run();

  log.info({ projectUri }, "backfill: starting");

  const cursorUs = await resolveProjectCursor(projectUri, { service: cfg.INDEXER_PDS_FALLBACK });
  if (cursorUs == null) {
    db.update(projectBackfills)
      .set({
        status: "error",
        error: "could not resolve project cursor",
        completedAtMs: Date.now(),
      })
      .where(eq(projectBackfills.projectUri, projectUri))
      .run();
    return getBackfillStatus(projectUri)!;
  }

  const startedAtMs = Date.now();
  db.update(projectBackfills)
    .set({ status: "running", startedAtMs, recordsAdded: 0, error: null })
    .where(eq(projectBackfills.projectUri, projectUri))
    .run();

  const catchupThresholdUs = (Date.now() - CATCHUP_GRACE_SECONDS * 1000) * 1000;
  const controller = new AbortController();
  let added = 0;

  try {
    for await (const ev of subscribe({
      collections: Object.values(COLLECTIONS),
      cursor: cursorUs,
      signal: controller.signal,
    })) {
      const eventUs = ev.timeMs * 1000;
      if (eventUs >= catchupThresholdUs) {
        controller.abort();
        break;
      }
      if (ev.source !== "jetstream") continue;
      // Cheap pre-filter: only persist events that mention this project at all.
      const step = (ev.record.step ?? null) as Record<string, unknown> | null;
      const eventProject = (step?.project ?? null) as Record<string, unknown> | null;
      if (eventProject?.uri !== projectUri) continue;

      const row = toRecordRow({
        uri: ev.uri,
        cid: ev.cid ?? "",
        did: ev.did,
        collection: ev.collection,
        rkey: ev.rkey,
        eventTimeMs: ev.timeMs,
        record: ev.record,
      });

      const result = db
        .insert(records)
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
      if (result.changes > 0) added += 1;
    }
  } catch (err) {
    log.error({ err, projectUri }, "backfill: replay failed");
    const message = err instanceof Error ? err.message : String(err);
    db.update(projectBackfills)
      .set({
        status: "error",
        error: message,
        completedAtMs: Date.now(),
        recordsAdded: added,
      })
      .where(eq(projectBackfills.projectUri, projectUri))
      .run();
    return getBackfillStatus(projectUri)!;
  } finally {
    controller.abort();
  }

  db.update(projectBackfills)
    .set({
      status: "done",
      completedAtMs: Date.now(),
      recordsAdded: added,
      error: null,
    })
    .where(eq(projectBackfills.projectUri, projectUri))
    .run();

  log.info({ projectUri, added }, "backfill: done");
  return getBackfillStatus(projectUri)!;
}
