/**
 * Thin SvelteKit adapter over `@dds/client/indexer`. Same pattern as the polis-interface lib.
 */

import { env as dynamicEnv } from "$env/dynamic/public";
import { createIndexerClient } from "@dds/client/indexer";

function defaultBase(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.hostname}:8001`;
}

const baseUrl = (dynamicEnv.PUBLIC_INDEXER_API_URL ?? "") || defaultBase();

export const indexer = createIndexerClient({ baseUrl });
