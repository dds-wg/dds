import { NodeOAuthClient, type NodeOAuthClientOptions } from "@atproto/oauth-client-node";
import { Agent } from "@atproto/api";
import { DDSClient } from "../agent.js";

/**
 * Thin convenience wrapper around `@atproto/oauth-client-node` for server-side
 * (e.g. clustering server) DDS workflows.
 *
 * For first-iteration POCs the simpler path is to use an app password directly:
 *
 * ```ts
 * import { BskyAgent } from "@atproto/api";
 * import { DDSClient } from "@dds/client";
 *
 * const agent = new BskyAgent({ service: "https://bsky.social" });
 * await agent.login({ identifier: "...", password: "..." });
 * const dds = new DDSClient(agent);
 * ```
 *
 * Use `createNodeAuth` when you need refresh-aware OAuth sessions.
 */
export interface NodeAuthConfig extends NodeOAuthClientOptions {}

export interface NodeAuth {
  client: NodeOAuthClient;
  /** Restore (or fail) a stored session for the given DID and return a DDSClient. */
  forDid(did: string): Promise<DDSClient>;
}

export async function createNodeAuth(config: NodeAuthConfig): Promise<NodeAuth> {
  const client = new NodeOAuthClient(config);
  return {
    client,
    async forDid(did: string): Promise<DDSClient> {
      const session = await client.restore(did);
      return new DDSClient(new Agent(session));
    },
  };
}
