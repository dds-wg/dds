import { BrowserOAuthClient, type OAuthSession } from "@atproto/oauth-client-browser";
import { Agent } from "@atproto/api";
import { DDSClient } from "../agent.js";

export interface BrowserAuthConfig {
  /** OAuth client ID. In production this is a URL pointing to your hosted client-metadata.json. */
  clientId: string;
  /** Override the bsky handle resolver. Defaults to bsky.social. */
  handleResolver?: string;
  /** Scopes to request. Default covers identity reads + generic record writes. */
  scopes?: string[];
}

const DEFAULT_SCOPES = ["atproto", "transition:generic"];

export interface BrowserAuth {
  /** The underlying OAuth client. Expose so consumers can wire in deeper integrations. */
  client: BrowserOAuthClient;
  /** True if a session is currently active in memory. */
  readonly signedIn: boolean;
  /** Start the OAuth dance for the given handle. Redirects the browser; never resolves. */
  signIn(handle: string): Promise<never>;
  /** Try to restore a session. Returns a DDSClient on success, undefined otherwise. */
  restore(): Promise<DDSClient | undefined>;
  /** Sign out and revoke the active session, if any. */
  signOut(): Promise<void>;
  /** The active DDS client, if any. */
  current(): DDSClient | undefined;
}

/**
 * Create a Bluesky OAuth client suitable for use from a SvelteKit (or any browser) app.
 *
 * Call `restore()` once on page load. Then:
 * - if no session is active, call `signIn(handle)` from a user-initiated event
 * - if a session is active, you'll get back a DDSClient ready to call lexicon methods
 */
export async function createBrowserAuth(config: BrowserAuthConfig): Promise<BrowserAuth> {
  const client = await BrowserOAuthClient.load({
    clientId: config.clientId,
    handleResolver: config.handleResolver ?? "https://bsky.social",
  });

  let session: OAuthSession | undefined;
  let ddsClient: DDSClient | undefined;

  const initial = await client.init();
  if (initial) {
    session = initial.session;
    ddsClient = new DDSClient(new Agent(session));
  }

  return {
    client,
    get signedIn() {
      return Boolean(ddsClient);
    },
    async signIn(handle: string): Promise<never> {
      await client.signInRedirect(handle, {
        scope: (config.scopes ?? DEFAULT_SCOPES).join(" "),
      });
      throw new Error("BrowserOAuthClient.signInRedirect should have navigated away");
    },
    async restore(): Promise<DDSClient | undefined> {
      const restored = await client.init();
      if (!restored) {
        session = undefined;
        ddsClient = undefined;
        return undefined;
      }
      session = restored.session;
      ddsClient = new DDSClient(new Agent(session));
      return ddsClient;
    },
    async signOut(): Promise<void> {
      if (session) {
        await client.revoke(session.sub);
        session = undefined;
      }
      ddsClient = undefined;
    },
    current(): DDSClient | undefined {
      return ddsClient;
    },
  };
}
