import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * One row per DDS record we've seen. The `value` column carries the full record value as
 * JSON; the typed columns extract commonly-queried fields for indexing.
 *
 * `recordCreatedAtMs` comes from the record's `createdAt` field (the authoritative time
 * the user/algorithm authored it). `indexedAtMs` is when we wrote it to the DB.
 */
export const records = sqliteTable(
  "records",
  {
    uri: text("uri").primaryKey(),
    cid: text("cid").notNull(),
    did: text("did").notNull(),
    collection: text("collection").notNull(),
    rkey: text("rkey").notNull(),
    recordCreatedAtMs: integer("record_created_at_ms").notNull(),
    indexedAtMs: integer("indexed_at_ms").notNull(),
    /** Pulled from `step.project.uri` when present. */
    projectUri: text("project_uri"),
    /** Pulled from `step.phase` when present. */
    phase: text("phase"),
    /** For records with a `target` strong-ref (votes, responses). */
    targetUri: text("target_uri"),
    /** For records with a `subject` strong-ref (metrics, classifications, summaries). */
    subjectUri: text("subject_uri"),
    /** Full record value as JSON. */
    value: text("value", { mode: "json" }).notNull(),
  },
  (t) => [
    index("idx_records_collection").on(t.collection),
    index("idx_records_project_step").on(t.projectUri, t.phase, t.collection),
    index("idx_records_target").on(t.targetUri),
    index("idx_records_subject").on(t.subjectUri),
    index("idx_records_did_collection").on(t.did, t.collection),
    index("idx_records_created").on(t.recordCreatedAtMs),
  ],
);

/**
 * Per-project backfill state. A "backfill" is a one-time jetstream replay from the
 * project's createdAt that populates `records` with everything historical.
 */
export const projectBackfills = sqliteTable("project_backfills", {
  projectUri: text("project_uri").primaryKey(),
  status: text("status").notNull(), // pending | running | done | error
  startedAtMs: integer("started_at_ms"),
  completedAtMs: integer("completed_at_ms"),
  recordsAdded: integer("records_added").default(0).notNull(),
  error: text("error"),
});

export type RecordRow = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type BackfillRow = typeof projectBackfills.$inferSelect;
