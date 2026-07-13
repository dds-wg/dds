/**
 * Loads and continually refreshes the data underlying a single visualisation: statements,
 * votes, groups, and metrics for a project step.
 *
 * Data sources, layered:
 * 1. The indexer (`@dds/indexer`) for statements, votes, groups, metrics. This is the primary
 *    source — it sees contributions from every user, via jetstream.
 * 2. The clustering server REST API, if `clusteringApiUrl` is set: we find an analysis matching
 *    `(projectUri, phase)` and overlay its latest run's groups + metrics. This is the path
 *    for algorithm-produced groups + GIC scores when the clustering server hasn't yet
 *    republished them as DDS records.
 */

import { browser } from "$app/environment";
import { indexer } from "./indexer";

export interface StatementRow {
  uri: string;
  cid: string;
  text: string;
  authorDid: string;
}

export interface VoteRow {
  uri: string;
  voterDid: string;
  targetUri: string;
  value: number;
}

export interface GroupRow {
  uri: string;
  cid: string;
  name: string;
  memberDids: string[];
  source: "indexer" | "clustering-server";
}

export interface MetricRow {
  uri: string;
  metricType: string;
  subjectUri: string;
  value: number | string | boolean | null;
  source: "indexer" | "clustering-server";
}

interface ClusteringAnalysisView {
  id: number;
  project_uri: string;
  phase: string;
  status: string;
}

interface ClusteringRunView {
  id: number;
  completed_at: string;
  statement_count: number;
  vote_count: number;
  voter_count: number;
  group_count: number;
  payload: {
    groups?: Array<{ group_id: number; name: string; voter_dids: string[] }>;
    statement_metrics?: Array<{
      statement_uri: string;
      agree_count: number;
      disagree_count: number;
      pass_count: number;
      group_informed_consensus: number | null;
      group_agree_rates?: Record<string, number>;
    }>;
    engine?: string;
    engine_version?: string;
  };
}

export class ReportData {
  statements = $state<StatementRow[]>([]);
  votes = $state<VoteRow[]>([]);
  groups = $state<GroupRow[]>([]);
  metrics = $state<MetricRow[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  /** Where the active groups/metrics came from, for UI provenance. */
  groupSource = $state<"indexer" | "clustering-server" | "none">("none");
  /** Latest run timestamp from the clustering server, if any. */
  latestRunAt = $state<string | null>(null);

  constructor(
    public projectUri: string,
    public phase: string,
    public clusteringApiUrl?: string,
  ) {}

  async load({ initial = true }: { initial?: boolean } = {}): Promise<void> {
    if (!browser) return;
    if (initial) this.loading = true;
    this.error = null;
    try {
      // Trigger a backfill in the background so any historical records get into the indexer.
      indexer.backfillProject(this.projectUri).catch(() => {
        /* indexer may be offline; subsequent list calls will return what's already there */
      });

      // Fetch into local buffers, then swap atomically at the end so consumers never see a
      // half-empty state during a refresh.
      const [nextStatements, nextVotes, nextGroupsAndMetrics] = await Promise.all([
        this.fetchStatements(),
        this.fetchVotes(),
        this.fetchIndexerGroupsAndMetrics(),
      ]);

      this.statements = nextStatements;
      this.votes = nextVotes;
      this.groups = nextGroupsAndMetrics.groups;
      this.metrics = nextGroupsAndMetrics.metrics;
      this.groupSource = nextGroupsAndMetrics.groups.length > 0 ? "indexer" : "none";
      this.latestRunAt = null;

      if (this.clusteringApiUrl) {
        await this.overlayFromClusteringApi();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      if (initial) this.loading = false;
    }
  }

  private async fetchStatements(): Promise<StatementRow[]> {
    const records = await indexer.listStatements({
      project: this.projectUri,
      phase: this.phase,
    });
    return records.map((r) => {
      const v = (r.value ?? {}) as Record<string, unknown>;
      return {
        uri: r.uri,
        cid: r.cid,
        text: String(v.text ?? ""),
        authorDid: ((v.author ?? {}) as Record<string, unknown>).did as string ?? r.did,
      };
    });
  }

  private async fetchVotes(): Promise<VoteRow[]> {
    const records = await indexer.listVotes({
      project: this.projectUri,
      phase: this.phase,
    });
    return records.map((r) => {
      const v = (r.value ?? {}) as Record<string, unknown>;
      return {
        uri: r.uri,
        voterDid: ((v.author ?? {}) as Record<string, unknown>).did as string ?? r.did,
        targetUri: r.targetUri ?? "",
        value: this.normalizeVoteValue(v.value),
      };
    });
  }

  private async fetchIndexerGroupsAndMetrics(): Promise<{
    groups: GroupRow[];
    metrics: MetricRow[];
  }> {
    const [groupRecords, metricRecords] = await Promise.all([
      indexer.listGroups({ project: this.projectUri, phase: this.phase }),
      indexer.listMetrics({ project: this.projectUri, phase: this.phase }),
    ]);
    const groups: GroupRow[] = groupRecords.map((r) => {
      const v = (r.value ?? {}) as Record<string, unknown>;
      const members = Array.isArray(v.members)
        ? (v.members as Array<Record<string, unknown>>)
        : [];
      return {
        uri: r.uri,
        cid: r.cid,
        name: String(v.name ?? "Group"),
        memberDids: members
          .map((m) => (m.did as string) ?? null)
          .filter((d): d is string => Boolean(d)),
        source: "indexer" as const,
      };
    });
    const metrics: MetricRow[] = metricRecords.map((r) => {
      const v = (r.value ?? {}) as Record<string, unknown>;
      return {
        uri: r.uri,
        metricType: String(v.metricType ?? ""),
        subjectUri: r.subjectUri ?? "",
        value: this.unwrapMetricValue(v.value),
        source: "indexer" as const,
      };
    });
    return { groups, metrics };
  }

  private async overlayFromClusteringApi(): Promise<void> {
    const base = (this.clusteringApiUrl ?? "").replace(/\/$/, "");
    if (!base) return;
    let analyses: ClusteringAnalysisView[];
    try {
      const res = await fetch(`${base}/api/analyses`);
      if (!res.ok) return;
      analyses = (await res.json()) as ClusteringAnalysisView[];
    } catch (err) {
      console.warn("clustering-api: failed to list analyses:", err);
      return;
    }

    const matches = analyses.filter(
      (a) => a.project_uri === this.projectUri && a.phase === this.phase,
    );
    if (matches.length === 0) return;

    matches.sort((a, b) => b.id - a.id);
    const target = matches[0];
    if (!target) return;

    let runs: ClusteringRunView[];
    try {
      const res = await fetch(`${base}/api/analyses/${target.id}/runs`);
      if (!res.ok) return;
      runs = (await res.json()) as ClusteringRunView[];
    } catch (err) {
      console.warn("clustering-api: failed to fetch runs:", err);
      return;
    }
    if (runs.length === 0) return;

    const latest = runs[0];
    if (!latest) return;
    this.latestRunAt = latest.completed_at;
    this.groupSource = "clustering-server";

    // Replace indexer-sourced groups/metrics: the run's output is the authoritative cluster
    // structure, and we don't want both side-by-side.
    this.groups = this.groups.filter((g) => g.source !== "indexer");
    this.metrics = this.metrics.filter((m) => m.source !== "indexer");

    for (const g of latest.payload.groups ?? []) {
      this.groups.push({
        uri: `clustering-server:${target.id}:run-${latest.id}:group-${g.group_id}`,
        cid: "",
        name: g.name,
        memberDids: g.voter_dids,
        source: "clustering-server",
      });
    }

    for (const m of latest.payload.statement_metrics ?? []) {
      if (m.group_informed_consensus !== null) {
        this.metrics.push({
          uri: `clustering-server:${target.id}:run-${latest.id}:gic:${m.statement_uri}`,
          metricType: "groupInformedConsensus",
          subjectUri: m.statement_uri,
          value: m.group_informed_consensus,
          source: "clustering-server",
        });
      }
      this.metrics.push({
        uri: `clustering-server:${target.id}:run-${latest.id}:agree:${m.statement_uri}`,
        metricType: "agreeCount",
        subjectUri: m.statement_uri,
        value: m.agree_count,
        source: "clustering-server",
      });
      this.metrics.push({
        uri: `clustering-server:${target.id}:run-${latest.id}:disagree:${m.statement_uri}`,
        metricType: "disagreeCount",
        subjectUri: m.statement_uri,
        value: m.disagree_count,
        source: "clustering-server",
      });
    }
  }

  private normalizeVoteValue(raw: unknown): number {
    if (!raw || typeof raw !== "object") return 0;
    const v = raw as Record<string, unknown>;
    const t = v.$type;
    if (t === "org.dds-wg.v1.vote#ordinal" && typeof v.value === "number") return v.value;
    if (t === "org.dds-wg.v1.vote#continuous" && typeof v.value === "number")
      return (v.value as number) / 10000;
    if (t === "org.dds-wg.v1.vote#approval") return v.approve ? 1 : -1;
    return 0;
  }

  private unwrapMetricValue(raw: unknown): number | string | boolean | null {
    if (!raw || typeof raw !== "object") return null;
    const v = raw as Record<string, unknown>;
    if (typeof v.integer === "number") return v.integer;
    if (typeof v.decimal === "string") return Number.parseFloat(v.decimal);
    if (typeof v.string === "string") return v.string;
    if (typeof v.boolean === "boolean") return v.boolean;
    if (typeof v.json === "string") return v.json;
    return null;
  }
}
