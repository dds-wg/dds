/**
 * Auth state shared across the polis-interface app. Uses `@dds/client`'s browser OAuth helper.
 *
 * Loopback OAuth (RFC 8252) requires `127.0.0.1`, NOT `localhost`. If the page is currently
 * served from `localhost`, we redirect the browser to the equivalent `127.0.0.1` URL before
 * doing any OAuth work, so the redirect_uri and the page origin match.
 *
 * Usage:
 *   import { auth } from "$lib/auth.svelte";
 *   await auth.init();
 *   const client = auth.client; // DDSClient | undefined
 */

import { browser } from "$app/environment";
import { createBrowserAuth, type BrowserAuth } from "@dds/client/auth/browser";
import type { DDSClient } from "@dds/client";

/**
 * The Bluesky OAuth loopback client uses a `client_id` of the form
 * `http://localhost?redirect_uri=...&scope=...`. The literal `localhost` is part of the spec
 * for the client_id itself, but the redirect_uri INSIDE it must use a loopback IP.
 */
function buildClientId(redirectUri: string): string {
  return (
    "http://localhost?" +
    new URLSearchParams({
      redirect_uri: redirectUri,
      scope: "atproto transition:generic",
    }).toString()
  );
}

/**
 * If we're on `localhost`, replace the URL hostname with `127.0.0.1` (preserving port + path
 * + query + hash) and navigate there. Returns true if a redirect was triggered.
 */
function redirectToLoopbackIp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.hostname !== "localhost") return false;
  const url = new URL(window.location.href);
  url.hostname = "127.0.0.1";
  window.location.replace(url.toString());
  return true;
}

class AuthStore {
  #auth = $state<BrowserAuth | null>(null);
  #client = $state<DDSClient | null>(null);
  #userDid = $state<string | null>(null);
  #initialized = $state(false);
  #error = $state<string | null>(null);

  get initialized() {
    return this.#initialized;
  }

  get error() {
    return this.#error;
  }

  get signedIn() {
    return this.#client !== null;
  }

  get client(): DDSClient | null {
    return this.#client;
  }

  get userDid() {
    return this.#userDid;
  }

  async init() {
    if (!browser || this.#initialized) return;
    if (redirectToLoopbackIp()) return; // will reload as 127.0.0.1
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const a = await createBrowserAuth({ clientId: buildClientId(redirectUri) });
      this.#auth = a;
      const restored = a.current();
      if (restored) {
        this.#client = restored;
        this.#userDid = restored.did ?? null;
      }
    } catch (err) {
      this.#error = err instanceof Error ? err.message : String(err);
    } finally {
      this.#initialized = true;
    }
  }

  async signIn(handle: string) {
    if (!this.#auth) await this.init();
    try {
      await this.#auth?.signIn(handle);
    } catch (err) {
      this.#error = err instanceof Error ? err.message : String(err);
    }
  }

  async signOut() {
    await this.#auth?.signOut();
    this.#client = null;
    this.#userDid = null;
  }
}

export const auth = new AuthStore();
