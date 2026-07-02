/**
 * Jetstream replay helpers for DDS project steps.
 *
 * A "project step" is a `(project_uri, phase)` pair. Replaying its history means: starting
 * from the project record's `createdAt`, walk the jetstream and yield every statement / vote /
 * group / metric / etc. whose `step` field points at this project + phase.
 *
 * These helpers are generic across consumers. They yield events; the caller decides what to do
 * with them (persist, render, etc.).
 *
 * Mirror of `dds_client.replay` (Python).
 */

import { Agent } from "@atproto/api";
import { subscribe, type DDSFeedEvent } from "./feed.js";

const DEFAULT_CATCHUP_GRACE_SECONDS = 2;
const DEFAULT_APPVIEW = "https://bsky.social";

export interface ResolveProjectCursorOptions {
  /** XRPC service to call `getRecord` against. Defaults to https://bsky.social. */
  service?: string;
  /** Optional pre-built agent (otherwise we use a bare fetch). */
  agent?: Agent;
}

/**
 * Resolve a project's `createdAt` to a unix-microsecond jetstream cursor. Returns null if the
 * URI is malformed, the record can't be fetched, or it has no parseable `createdAt`.
 */
export async function resolveProjectCursor(
  projectUri: string,
  options: ResolveProjectCursorOptions = {},
): Promise<number | null> {
  if (!projectUri.startsWith("at://")) return null;
  const parts = projectUri.slice(5).split("/");
  if (parts.length !== 3) return null;
  const [hostDid, collection, rkey] = parts as [string, string, string];

  let data: { value?: { createdAt?: unknown } } | null = null;
  try {
    if (options.agent) {
      const res = await options.agent.com.atproto.repo.getRecord({
        repo: hostDid,
        collection,
        rkey,
      });
      data = { value: res.data.value as { createdAt?: unknown } };
    } else {
      const service = options.service ?? DEFAULT_APPVIEW;
      const url = new URL("/xrpc/com.atproto.repo.getRecord", service);
      url.searchParams.set("repo", hostDid);
      url.searchParams.set("collection", collection);
      url.searchParams.set("rkey", rkey);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      data = (await res.json()) as typeof data;
    }
  } catch {
    return null;
  }

  const createdAt = data?.value?.createdAt;
  if (typeof createdAt !== "string") return null;
  const ms = Date.parse(createdAt);
  if (!Number.isFinite(ms)) return null;
  return ms * 1000;
}

/** True if a record's `step` field points at the given project + phase. */
export function stepMatches(
  record: Record<string, unknown> | null | undefined,
  projectUri: string,
  phase: string,
): boolean {
  if (!record) return false;
  const step = (record.step ?? {}) as Record<string, unknown>;
  const project = (step.project ?? {}) as Record<string, unknown>;
  return project.uri === projectUri && step.phase === phase;
}

export interface ReplayProjectStepOptions {
  projectUri: string;
  phase: string;
  /** Collections to follow. Defaults to all DDS collections. */
  collections?: string[];
  /** Skip cursor resolution and start from this explicit unix-microsecond timestamp. */
  cursorUs?: number;
  /** Seconds-of-grace before we declare "caught up to now". Defaults to 2. */
  catchupGraceSeconds?: number;
  /** PDS service for the `getRecord` call that resolves the project's createdAt. */
  service?: string;
  /** Optional pre-built agent (used both for `getRecord` and as the catch-up fetcher). */
  agent?: Agent;
  /** Optional logger; defaults to a no-op. */
  logger?: { info: (msg: string) => void; error: (err: unknown) => void };
}

/**
 * Replay jetstream from the project's createdAt onward, yielding events whose `step` matches.
 *
 * Stops as soon as jetstream's emitted event timestamps reach within `catchupGraceSeconds` of
 * wall-clock now. After that the caller should rely on `subscribe(...)` (live mode) to keep up.
 */
export async function* replayProjectStep(
  opts: ReplayProjectStepOptions,
): AsyncGenerator<DDSFeedEvent, void, undefined> {
  let cursor = opts.cursorUs;
  if (cursor == null) {
    const resolved = await resolveProjectCursor(opts.projectUri, {
      service: opts.service,
      agent: opts.agent,
    });
    if (resolved == null) return;
    cursor = resolved;
  }

  const grace = (opts.catchupGraceSeconds ?? DEFAULT_CATCHUP_GRACE_SECONDS) * 1000;
  const catchupThresholdUs = (Date.now() - grace) * 1000;

  const controller = new AbortController();

  try {
    for await (const ev of subscribe({
      collections: opts.collections,
      cursor,
      agent: opts.agent,
      logger: opts.logger,
      signal: controller.signal,
    })) {
      const eventUs = ev.timeMs * 1000;
      if (eventUs >= catchupThresholdUs) {
        controller.abort();
        break;
      }
      if (ev.source !== "jetstream") continue;
      if (!stepMatches(ev.record, opts.projectUri, opts.phase)) continue;
      yield ev;
    }
  } finally {
    controller.abort();
  }
}
