import { Jetstream } from "@skyware/jetstream";
import { Agent } from "@atproto/api";
import { COLLECTIONS, type DDSCollection } from "./version.js";

/** A normalized event surfaced by `subscribe`. Wraps both live jetstream events and PDS catch-up. */
export interface DDSFeedEvent {
  /** Source of this event: live jetstream stream, or PDS catch-up. */
  source: "jetstream" | "catchup";
  /** AT Protocol repo DID this record belongs to. */
  did: string;
  /** Collection NSID. */
  collection: DDSCollection | string;
  rkey: string;
  uri: string;
  cid?: string;
  /** Timestamp normalized to milliseconds since epoch. */
  timeMs: number;
  /** The record value as authored. */
  record: Record<string, unknown>;
}

export interface DDSSubscribeOptions {
  /** Which DDS collections to follow. Defaults to all v1 collections. */
  collections?: string[];
  /** Specific DIDs to filter by. */
  dids?: string[];
  /** Optional cursor (unix microseconds, jetstream-native) to resume from. */
  cursor?: number;
  /**
   * If set, the consumer will, on startup, call `com.atproto.repo.listRecords` against each
   * `dids[]` x `collections[]` pair, emitting any record newer than `catchupSince` as a
   * `source: "catchup"` event before live streaming starts. Use this to fill gaps after downtime.
   */
  catchupSince?: Date;
  /**
   * If provided, used to fetch PDS records during catch-up. If omitted, an unauthenticated
   * Agent against `bsky.social` is used. Catch-up requires `dids` set.
   */
  agent?: Agent;
  /** Optional logger; defaults to a no-op. */
  logger?: { info: (msg: string) => void; error: (err: unknown) => void };
  /** AbortSignal to cleanly stop the consumer. */
  signal?: AbortSignal;
}

const NOP_LOGGER = { info: (_: string) => {}, error: (_: unknown) => {} };

/**
 * Subscribe to DDS records as an async iterator. Yields catch-up records first (if requested),
 * then live jetstream events. Stops when the signal aborts.
 */
export async function* subscribe(
  opts: DDSSubscribeOptions = {},
): AsyncGenerator<DDSFeedEvent, void, undefined> {
  const collections = opts.collections ?? Object.values(COLLECTIONS);
  const logger = opts.logger ?? NOP_LOGGER;

  if (opts.catchupSince && opts.dids?.length) {
    yield* runCatchup({
      since: opts.catchupSince,
      dids: opts.dids,
      collections,
      agent: opts.agent ?? new Agent("https://bsky.social"),
      logger,
      signal: opts.signal,
    });
  }

  const jetstream = new Jetstream({
    wantedCollections: collections,
    wantedDids: opts.dids,
    cursor: opts.cursor,
  });

  const queue: DDSFeedEvent[] = [];
  let waiter: ((ev: DDSFeedEvent | null) => void) | null = null;

  const push = (ev: DDSFeedEvent) => {
    if (waiter) {
      const w = waiter;
      waiter = null;
      w(ev);
    } else {
      queue.push(ev);
    }
  };

  jetstream.on("commit", (event) => {
    const commit = event.commit;
    if (commit.operation !== "create" && commit.operation !== "update") return;
    const rec = (commit as { record?: unknown }).record;
    if (!rec || typeof rec !== "object") return;
    push({
      source: "jetstream",
      did: event.did,
      collection: commit.collection,
      rkey: commit.rkey,
      uri: `at://${event.did}/${commit.collection}/${commit.rkey}`,
      cid: (commit as { cid?: string }).cid,
      timeMs: event.time_us / 1000,
      record: rec as Record<string, unknown>,
    });
  });

  jetstream.on("error", (err) => logger.error(err));

  const onAbort = () => {
    jetstream.close();
    if (waiter) {
      const w = waiter;
      waiter = null;
      w(null);
    }
  };
  opts.signal?.addEventListener("abort", onAbort, { once: true });

  jetstream.start();
  logger.info("DDS feed: jetstream started");

  try {
    while (!opts.signal?.aborted) {
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }
      const ev = await new Promise<DDSFeedEvent | null>((resolve) => {
        waiter = resolve;
      });
      if (ev === null) break;
      yield ev;
    }
  } finally {
    opts.signal?.removeEventListener("abort", onAbort);
    jetstream.close();
    logger.info("DDS feed: jetstream stopped");
  }
}

async function* runCatchup(args: {
  since: Date;
  dids: string[];
  collections: string[];
  agent: Agent;
  logger: NonNullable<DDSSubscribeOptions["logger"]>;
  signal: AbortSignal | undefined;
}): AsyncGenerator<DDSFeedEvent, void, undefined> {
  const sinceMs = args.since.getTime();
  for (const did of args.dids) {
    for (const collection of args.collections) {
      if (args.signal?.aborted) return;
      let cursor: string | undefined;
      do {
        const res = await args.agent.com.atproto.repo
          .listRecords({ repo: did, collection, limit: 100, cursor })
          .catch((err) => {
            args.logger.error(err);
            return undefined;
          });
        if (!res) break;
        for (const r of res.data.records) {
          const value = r.value as Record<string, unknown> | null;
          if (!value || typeof value !== "object") continue;
          const createdAt = typeof value.createdAt === "string" ? Date.parse(value.createdAt) : NaN;
          if (!Number.isFinite(createdAt) || createdAt < sinceMs) continue;
          const parts = r.uri.replace("at://", "").split("/");
          const [parsedDid, parsedColl, parsedRkey] = parts;
          if (!parsedDid || !parsedColl || !parsedRkey) continue;
          yield {
            source: "catchup",
            did: parsedDid,
            collection: parsedColl,
            rkey: parsedRkey,
            uri: r.uri,
            cid: r.cid,
            timeMs: createdAt,
            record: value,
          };
        }
        cursor = res.data.cursor;
      } while (cursor);
    }
  }
}
