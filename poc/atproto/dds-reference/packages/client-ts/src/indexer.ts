/**
 * Typed client for the `@dds/indexer` REST API.
 *
 * Framework-agnostic: caller passes a `baseUrl` string. SvelteKit apps wrap this with a thin
 * adapter that pulls the URL from `$env/dynamic/public`; Node services pass it directly.
 *
 * The indexer is a generic appview for the DDS lexicon: it subscribes to jetstream, persists
 * every `org.dds-wg.v1.*` record, and exposes filtered list endpoints. See `apps/indexer/`
 * for the implementation.
 */

export interface IndexerRecord {
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

export interface IndexerPage<T = IndexerRecord> {
  items: T[];
  cursor: string | null;
}

export interface IndexerListQuery {
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
  limit?: number;
  cursor?: string;
}

export interface BackfillStatus {
  projectUri: string;
  status: "pending" | "running" | "done" | "error";
  startedAtMs: number | null;
  completedAtMs: number | null;
  recordsAdded: number;
  error: string | null;
}

export interface IndexerClient {
  baseUrl: string;
  health(): Promise<{ status: string }>;

  listStatements(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listVotes(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listGroups(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listMetrics(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listResponses(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listProposals(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listDecisions(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listSummaries(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listClassifications(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listAlgorithms(query: IndexerListQuery): Promise<IndexerRecord[]>;
  listProjects(query?: IndexerListQuery): Promise<IndexerRecord[]>;

  /** Single-page list with explicit cursor. Use when you want to control pagination. */
  pageStatements(query: IndexerListQuery): Promise<IndexerPage>;
  pageVotes(query: IndexerListQuery): Promise<IndexerPage>;
  pageGroups(query: IndexerListQuery): Promise<IndexerPage>;
  pageMetrics(query: IndexerListQuery): Promise<IndexerPage>;

  getRecord(uri: string): Promise<IndexerRecord>;

  backfillProject(projectUri: string): Promise<{ status: string; projectUri: string }>;
  backfillStatus(projectUri: string): Promise<BackfillStatus>;
}

export interface CreateIndexerClientOptions {
  /** Base URL of the indexer (e.g. `http://indexer:8001` or `https://example.com/indexer`). */
  baseUrl: string;
  /** Optional fetch override (Node 18+, browsers, undici, etc.) */
  fetch?: typeof fetch;
}

/**
 * Build a typed client for the indexer at `baseUrl`. The client is stateless; create one
 * per service / per process and reuse it.
 */
export function createIndexerClient(opts: CreateIndexerClientOptions): IndexerClient {
  const base = opts.baseUrl.replace(/\/$/, "");
  const doFetch: typeof fetch = opts.fetch ?? globalThis.fetch.bind(globalThis);

  async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await doFetch(`${base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`indexer ${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json()) as T;
  }

  function toQuery(q: IndexerListQuery): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) {
      if (v == null) continue;
      params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  async function listAll(path: string, query: IndexerListQuery): Promise<IndexerRecord[]> {
    const out: IndexerRecord[] = [];
    const limit = query.limit ?? 100;
    let cursor: string | null | undefined = query.cursor;
    while (true) {
      const page: IndexerPage = await http(
        `${path}${toQuery({ ...query, limit, cursor })}`,
      );
      out.push(...page.items);
      // The indexer always returns a cursor pointing at the last item we saw (so polling
      // consumers can resume). We detect end-of-stream by an underfull page.
      if (page.items.length < limit) break;
      cursor = page.cursor;
      if (!cursor) break;
    }
    return out;
  }

  function pageOf(path: string) {
    return (q: IndexerListQuery) => http<IndexerPage>(`${path}${toQuery(q)}`);
  }

  function listOf(path: string) {
    return (q: IndexerListQuery) => listAll(path, q);
  }

  return {
    baseUrl: base,
    health: () => http("/api/health"),

    listStatements: listOf("/api/statements"),
    listVotes: listOf("/api/votes"),
    listGroups: listOf("/api/groups"),
    listMetrics: listOf("/api/metrics"),
    listResponses: listOf("/api/responses"),
    listProposals: listOf("/api/proposals"),
    listDecisions: listOf("/api/decisions"),
    listSummaries: listOf("/api/summaries"),
    listClassifications: listOf("/api/classifications"),
    listAlgorithms: listOf("/api/algorithms"),
    listProjects: (q = {}) => listAll("/api/projects", q),

    pageStatements: pageOf("/api/statements"),
    pageVotes: pageOf("/api/votes"),
    pageGroups: pageOf("/api/groups"),
    pageMetrics: pageOf("/api/metrics"),

    getRecord: (uri: string) =>
      http<IndexerRecord>(`/api/records?uri=${encodeURIComponent(uri)}`),

    backfillProject: (projectUri: string) =>
      http<{ status: string; projectUri: string }>("/api/projects/backfill", {
        method: "POST",
        body: JSON.stringify({ projectUri }),
      }),
    backfillStatus: (projectUri: string) =>
      http<BackfillStatus>(
        `/api/projects/backfill?project=${encodeURIComponent(projectUri)}`,
      ),
  };
}
