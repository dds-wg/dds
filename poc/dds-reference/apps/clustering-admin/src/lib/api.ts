/**
 * Thin typed wrapper around the clustering_server REST API.
 *
 * URL base resolution:
 * - `PUBLIC_CLUSTERING_API_URL` from `$env/dynamic/public` if set (e.g. in Docker prod), used as-is
 * - otherwise empty, so calls hit `/api/*` on the same origin. This works for:
 *   - the Vite dev proxy (configured in `vite.config.ts`)
 *   - the Caddy reverse proxy in production compose (routes `/api/*` to the FastAPI service)
 */

import { env as publicEnv } from "$env/dynamic/public";

const BASE = (publicEnv.PUBLIC_CLUSTERING_API_URL ?? "").replace(/\/$/, "");

export interface AnalysisView {
  id: number;
  owner_did: string;
  project_uri: string;
  project_cid: string;
  phase: string;
  status: "active" | "paused" | "ended";
  rerun_threshold: number;
  last_run_at: string | null;
  new_events_since_run: number;
  algorithm_uri: string | null;
  statement_count: number;
  vote_count: number;
  created_at: string;
}

export interface RunResultView {
  id: number;
  completed_at: string;
  statement_count: number;
  vote_count: number;
  voter_count: number;
  group_count: number;
  payload: Record<string, unknown>;
}

export interface AnalysisCreate {
  owner_did: string;
  project_uri: string;
  project_cid: string;
  phase: string;
  rerun_threshold?: number;
}

export interface AnalysisUpdate {
  status?: "active" | "paused" | "ended";
  rerun_threshold?: number;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => http<{ status: string }>("/api/health"),
  list: () => http<AnalysisView[]>("/api/analyses"),
  get: (id: number) => http<AnalysisView>(`/api/analyses/${id}`),
  create: (body: AnalysisCreate) =>
    http<AnalysisView>("/api/analyses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: AnalysisUpdate) =>
    http<AnalysisView>(`/api/analyses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  run: (id: number) => http<RunResultView>(`/api/analyses/${id}/run`, { method: "POST" }),
  runs: (id: number) => http<RunResultView[]>(`/api/analyses/${id}/runs`),
  backfill: (id: number) =>
    http<{ added: number }>(`/api/analyses/${id}/backfill`, { method: "POST" }),
};
