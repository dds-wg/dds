/**
 * Shared auth store. Mirrors the polis-interface pattern: a singleton DDSClient backed by the
 * @dds/client browser OAuth helper.
 *
 * Loopback OAuth (RFC 8252) requires `127.0.0.1`, not `localhost`, so we transparently
 * redirect when the page is served from the `localhost` hostname.
 */

import { browser } from "$app/environment";
import { createBrowserAuth, type BrowserAuth } from "@dds/client/auth/browser";
import type { DDSClient } from "@dds/client";

function buildClientId(redirectUri: string): string {
  return (
    "http://localhost?" +
    new URLSearchParams({
      redirect_uri: redirectUri,
      scope: "atproto transition:generic",
    }).toString()
  );
}

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
  get client() {
    return this.#client;
  }
  get userDid() {
    return this.#userDid;
  }

  async init() {
    if (!browser || this.#initialized) return;
    if (redirectToLoopbackIp()) return;
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const a = await createBrowserAuth({ clientId: buildClientId(redirectUri) });
      this.#auth = a;
      const c = a.current();
      if (c) {
        this.#client = c;
        this.#userDid = c.did ?? null;
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
