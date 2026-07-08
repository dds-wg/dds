/**
 * Extract indexed columns from a DDS record value. Centralizes the "where do common fields
 * live" knowledge so both the live listener and the backfill path produce identical rows.
 */
import type { NewRecord } from "./db/schema.js";

export interface ExtractInput {
  uri: string;
  cid: string;
  did: string;
  collection: string;
  rkey: string;
  /** Source-of-truth event timestamp in milliseconds (from jetstream `time_us / 1000`). */
  eventTimeMs: number;
  record: Record<string, unknown>;
}

export function toRecordRow(input: ExtractInput): NewRecord {
  const value = input.record;
  return {
    uri: input.uri,
    cid: input.cid,
    did: input.did,
    collection: input.collection,
    rkey: input.rkey,
    recordCreatedAtMs: parseCreatedAtMs(value.createdAt) ?? input.eventTimeMs,
    indexedAtMs: Date.now(),
    projectUri: extractProjectUri(value),
    phase: extractPhase(value),
    targetUri: extractTargetUri(value),
    subjectUri: extractSubjectUri(value),
    value,
  };
}

function parseCreatedAtMs(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function extractProjectUri(value: Record<string, unknown>): string | null {
  const step = (value.step ?? null) as Record<string, unknown> | null;
  if (!step) return null;
  const project = (step.project ?? null) as Record<string, unknown> | null;
  const uri = project?.uri;
  return typeof uri === "string" ? uri : null;
}

function extractPhase(value: Record<string, unknown>): string | null {
  const step = (value.step ?? null) as Record<string, unknown> | null;
  const phase = step?.phase;
  return typeof phase === "string" ? phase : null;
}

function extractTargetUri(value: Record<string, unknown>): string | null {
  const target = (value.target ?? null) as Record<string, unknown> | null;
  const uri = target?.uri;
  return typeof uri === "string" ? uri : null;
}

function extractSubjectUri(value: Record<string, unknown>): string | null {
  const subject = (value.subject ?? null) as Record<string, unknown> | null;
  const uri = subject?.uri;
  return typeof uri === "string" ? uri : null;
}
