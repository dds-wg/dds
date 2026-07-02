/**
 * DID -> PDS resolution. Used to route cross-repo reads to the correct PDS, since an
 * authenticated session is bound to its own PDS and can't fetch records hosted elsewhere.
 *
 * Supports `did:plc:*` (via plc.directory) and `did:web:*` (via the well-known DID document).
 * Results are cached in-process to avoid repeated lookups.
 */

const cache = new Map<string, string | null>();
let pending = new Map<string, Promise<string | null>>();

export interface ResolveDidOptions {
  /** Override the plc.directory base URL. */
  plcDirectory?: string;
}

/**
 * Resolve a DID to its `#atproto_pds` service endpoint URL, or `null` if the DID can't be
 * resolved (network failure, malformed doc, missing service, unsupported DID method).
 */
export async function resolveDidPds(
  did: string,
  options: ResolveDidOptions = {},
): Promise<string | null> {
  if (cache.has(did)) return cache.get(did)!;
  const existing = pending.get(did);
  if (existing) return existing;

  const p = (async () => {
    const url = didDocumentUrl(did, options);
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const doc = (await res.json()) as DidDocument;
      const endpoint = extractPdsEndpoint(doc, did);
      cache.set(did, endpoint);
      return endpoint;
    } catch {
      cache.set(did, null);
      return null;
    } finally {
      pending.delete(did);
    }
  })();
  pending.set(did, p);
  return p;
}

/** For testing: drop cached resolutions. */
export function clearDidResolverCache(): void {
  cache.clear();
  pending = new Map();
}

interface DidDocument {
  service?: Array<{ id?: string; type?: string; serviceEndpoint?: string | { uri?: string } }>;
}

function didDocumentUrl(did: string, options: ResolveDidOptions): string | null {
  if (did.startsWith("did:plc:")) {
    const base = (options.plcDirectory ?? "https://plc.directory").replace(/\/$/, "");
    return `${base}/${did}`;
  }
  if (did.startsWith("did:web:")) {
    const rest = did.slice("did:web:".length);
    // did:web:domain[:path] -> https://domain[/path]/.well-known/did.json
    const segments = rest.split(":").map(decodeURIComponent);
    const domain = segments.shift();
    if (!domain) return null;
    const path = segments.length > 0 ? "/" + segments.join("/") : "";
    return `https://${domain}${path}/.well-known/did.json`;
  }
  return null;
}

function extractPdsEndpoint(doc: DidDocument, did: string): string | null {
  const services = doc.service ?? [];
  const want = new Set(["#atproto_pds", `${did}#atproto_pds`]);
  for (const s of services) {
    if (!s) continue;
    const matchesId = s.id && want.has(s.id);
    const matchesType = s.type === "AtprotoPersonalDataServer";
    if (!matchesId && !matchesType) continue;
    const ep = s.serviceEndpoint;
    if (typeof ep === "string") return ep;
    if (ep && typeof ep === "object" && typeof ep.uri === "string") return ep.uri;
  }
  return null;
}
