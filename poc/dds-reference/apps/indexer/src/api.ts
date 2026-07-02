/**
 * Fastify REST API for the DDS indexer.
 *
 * DDS-specific endpoints, keyed off `step.project.uri` + `step.phase`:
 *   GET  /api/health
 *   GET  /api/statements?project=&phase=&author=&limit=&cursor=
 *   GET  /api/votes?project=&phase=&target=&voter=&limit=&cursor=
 *   GET  /api/groups?project=&phase=&creator=&limit=&cursor=
 *   GET  /api/metrics?project=&phase=&subject=&metricType=&limit=&cursor=
 *   GET  /api/responses?target=&author=&limit=&cursor=
 *   GET  /api/proposals?project=&phase=&creator=&limit=&cursor=
 *   GET  /api/decisions?project=&phase=&creator=&limit=&cursor=
 *   GET  /api/summaries?subject=&creator=&limit=&cursor=
 *   GET  /api/classifications?subject=&creator=&label=&limit=&cursor=
 *   GET  /api/algorithms?creator=&limit=&cursor=
 *   GET  /api/projects?repo=&limit=&cursor=
 *   GET  /api/records?uri=
 *   POST /api/projects/backfill        body: { projectUri }
 *   GET  /api/projects/backfill?project=
 *
 * Cursor is an opaque `indexedAtMs|uri` token; pagination orders by indexedAtMs ascending.
 */
import { COLLECTIONS } from "@dds/client";
import cors from "@fastify/cors";
import { and, eq, gt, or, asc } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";

import { backfillProject, getBackfillStatus } from "./backfill.js";
import { getConfig } from "./config.js";
import { getDb } from "./db/client.js";
import { records } from "./db/schema.js";

interface ListQuery {
  project?: string;
  phase?: string;
  target?: string;
  subject?: string;
  voter?: string;
  author?: string;
  creator?: string;
  metricType?: string;
  label?: string;
  repo?: string;
  limit?: string;
  cursor?: string;
}

interface CursorParts {
  indexedAtMs: number;
  uri: string;
}

function decodeCursor(raw: string | undefined): CursorParts | null {
  if (!raw) return null;
  const [t, u] = raw.split("|");
  if (!t || !u) return null;
  const ts = Number.parseInt(t, 10);
  if (!Number.isFinite(ts)) return null;
  return { indexedAtMs: ts, uri: u };
}

function encodeCursor(row: { indexedAtMs: number; uri: string }): string {
  return `${row.indexedAtMs}|${row.uri}`;
}

function parseLimit(raw: string | undefined): number {
  const n = raw == null ? 50 : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 50;
  if (n > 200) return 200;
  return n;
}

interface RecordView {
  uri: string;
  cid: string;
  did: string;
  collection: string;
  rkey: string;
  recordCreatedAt: string;
  indexedAt: string;
  projectUri: string | null;
  phase: string | null;
  targetUri: string | null;
  subjectUri: string | null;
  value: unknown;
}

function toView(row: typeof records.$inferSelect): RecordView {
  return {
    uri: row.uri,
    cid: row.cid,
    did: row.did,
    collection: row.collection,
    rkey: row.rkey,
    recordCreatedAt: new Date(row.recordCreatedAtMs).toISOString(),
    indexedAt: new Date(row.indexedAtMs).toISOString(),
    projectUri: row.projectUri,
    phase: row.phase,
    targetUri: row.targetUri,
    subjectUri: row.subjectUri,
    value: row.value,
  };
}

function buildList(opts: {
  collection: string;
  query: ListQuery;
  /** Optional extra `eq()` filters, keyed by record field. */
  extraFilters?: Array<ReturnType<typeof eq>>;
}): { items: RecordView[]; cursor: string | null } {
  const db = getDb();
  const filters: Array<ReturnType<typeof eq>> = [eq(records.collection, opts.collection)];
  if (opts.query.project) filters.push(eq(records.projectUri, opts.query.project));
  if (opts.query.phase) filters.push(eq(records.phase, opts.query.phase));
  if (opts.query.target) filters.push(eq(records.targetUri, opts.query.target));
  if (opts.query.subject) filters.push(eq(records.subjectUri, opts.query.subject));
  if (opts.extraFilters) filters.push(...opts.extraFilters);

  const limit = parseLimit(opts.query.limit);
  const cur = decodeCursor(opts.query.cursor);

  const whereClause = cur
    ? and(
        ...filters,
        or(
          gt(records.indexedAtMs, cur.indexedAtMs),
          and(eq(records.indexedAtMs, cur.indexedAtMs), gt(records.uri, cur.uri)),
        )!,
      )
    : and(...filters);

  const rows = db
    .select()
    .from(records)
    .where(whereClause)
    .orderBy(asc(records.indexedAtMs), asc(records.uri))
    .limit(limit + 1)
    .all();

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  // We always return a cursor reflecting "where we are" in the stream, even when this is the
  // last page. Pure-pagination consumers detect "end" via items.length < limit; incremental-
  // polling consumers save the cursor between polls to pick up only newer records.
  const lastRow = slice[slice.length - 1];
  const nextCursor = lastRow
    ? encodeCursor(lastRow)
    : cur
      ? `${cur.indexedAtMs}|${cur.uri}`
      : null;
  return { items: slice.map(toView), cursor: nextCursor };
}

export function buildServer(): FastifyInstance {
  const cfg = getConfig();
  const app = Fastify({
    logger: {
      level: cfg.INDEXER_LOG_LEVEL,
      transport: { target: "pino-pretty" },
    },
  });

  app.register(cors, { origin: cfg.INDEXER_CORS_ORIGINS, credentials: true });

  app.get("/api/health", async () => ({ status: "ok" }));

  // -------- Project-scoped collection listings --------

  type ListReq = { Querystring: ListQuery };

  const collectionRoute = (
    path: string,
    collection: string,
    extras?: (q: ListQuery) => Array<ReturnType<typeof eq>>,
  ) => {
    app.get<ListReq>(path, async (req) => {
      const query = req.query;
      const extraFilters: Array<ReturnType<typeof eq>> = [];
      if (extras) extraFilters.push(...extras(query));
      if (query.author) extraFilters.push(eq(records.did, query.author));
      if (query.voter) extraFilters.push(eq(records.did, query.voter));
      if (query.creator) extraFilters.push(eq(records.did, query.creator));
      return buildList({ collection, query, extraFilters });
    });
  };

  collectionRoute("/api/statements", COLLECTIONS.statement);
  collectionRoute("/api/votes", COLLECTIONS.vote);
  collectionRoute("/api/groups", COLLECTIONS.group);
  collectionRoute("/api/metrics", COLLECTIONS.metric, (q) =>
    q.metricType
      ? [eq(records.value as never, JSON.stringify({ metricType: q.metricType }) as never)]
      : [],
  );
  collectionRoute("/api/responses", COLLECTIONS.response);
  collectionRoute("/api/proposals", COLLECTIONS.proposal);
  collectionRoute("/api/decisions", COLLECTIONS.decision);
  collectionRoute("/api/summaries", COLLECTIONS.summary);
  collectionRoute("/api/classifications", COLLECTIONS.classification);
  collectionRoute("/api/algorithms", COLLECTIONS.algorithm);

  // Project list. Scoped by `repo` (DID) optional filter.
  app.get<ListReq>("/api/projects", async (req) => {
    const extraFilters: Array<ReturnType<typeof eq>> = [];
    if (req.query.repo) extraFilters.push(eq(records.did, req.query.repo));
    return buildList({ collection: COLLECTIONS.project, query: req.query, extraFilters });
  });

  // -------- Single-record fetch --------

  app.get<{ Querystring: { uri?: string } }>("/api/records", async (req, reply) => {
    const uri = req.query.uri;
    if (!uri) return reply.code(400).send({ error: "missing ?uri" });
    const row = getDb().select().from(records).where(eq(records.uri, uri)).get();
    if (!row) return reply.code(404).send({ error: "not found" });
    return toView(row);
  });

  // -------- Backfill --------

  app.post<{ Body: { projectUri?: string } }>(
    "/api/projects/backfill",
    async (req, reply) => {
      const projectUri = req.body?.projectUri;
      if (!projectUri) return reply.code(400).send({ error: "missing projectUri" });
      // Fire-and-forget: respond immediately, run in background.
      void backfillProject(projectUri, app.log).catch((err) =>
        app.log.error({ err, projectUri }, "backfill threw"),
      );
      return { status: "queued", projectUri };
    },
  );

  app.get<{ Querystring: { project?: string } }>(
    "/api/projects/backfill",
    async (req, reply) => {
      const projectUri = req.query.project;
      if (!projectUri) return reply.code(400).send({ error: "missing ?project" });
      const status = getBackfillStatus(projectUri);
      if (!status) return reply.code(404).send({ error: "no backfill on record" });
      return status;
    },
  );

  return app;
}
