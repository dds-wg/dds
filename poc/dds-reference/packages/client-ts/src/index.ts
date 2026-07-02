/**
 * Main entrypoint. Browser-safe: contains only environment-agnostic code (the DDSClient class,
 * lexicon constants, types, and the Jetstream feed consumer).
 *
 * Auth helpers live at subpaths so they don't drag node-only deps into the browser bundle:
 * - Browser apps: import { createBrowserAuth } from "@dds/client/auth/browser";
 * - Node servers: import { createNodeAuth } from "@dds/client/auth/node";
 */
export { LEXICON_MAJOR, LEXICON_VERSION, LEXICON_NS, COLLECTIONS } from "./version.js";
export type { DDSCollection } from "./version.js";

export { DDSClient, parseAtUri } from "./agent.js";
export type { AgentLike, CreateRecordResult } from "./agent.js";

export { subscribe } from "./feed.js";
export type { DDSFeedEvent, DDSSubscribeOptions } from "./feed.js";

export { replayProjectStep, resolveProjectCursor, stepMatches } from "./replay.js";
export type { ReplayProjectStepOptions, ResolveProjectCursorOptions } from "./replay.js";

export { resolveDidPds, clearDidResolverCache } from "./identity.js";
export type { ResolveDidOptions } from "./identity.js";

export { createIndexerClient } from "./indexer.js";
export type {
  BackfillStatus,
  CreateIndexerClientOptions,
  IndexerClient,
  IndexerListQuery,
  IndexerPage,
  IndexerRecord,
} from "./indexer.js";

export * as Lexicon from "./lexicon/index.js";
