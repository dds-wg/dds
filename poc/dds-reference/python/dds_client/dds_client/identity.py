"""DID -> PDS resolution. Mirror of `@dds/client`'s identity helper.

Supports `did:plc:*` (via plc.directory) and `did:web:*` (via the well-known DID document).
Results are cached in-process.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

log = logging.getLogger(__name__)

_cache: dict[str, Optional[str]] = {}
DEFAULT_PLC_DIRECTORY = "https://plc.directory"


async def resolve_did_pds(
    did: str,
    *,
    plc_directory: str = DEFAULT_PLC_DIRECTORY,
) -> Optional[str]:
    """Return the `#atproto_pds` service endpoint URL for a DID, or None if not resolvable."""
    if did in _cache:
        return _cache[did]

    url = _did_document_url(did, plc_directory)
    if not url:
        _cache[did] = None
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(url)
            resp.raise_for_status()
            doc = resp.json()
    except Exception as exc:
        log.warning("resolve_did_pds: failed for %s: %s", did, exc)
        _cache[did] = None
        return None

    endpoint = _extract_pds_endpoint(doc, did)
    _cache[did] = endpoint
    return endpoint


def clear_did_resolver_cache() -> None:
    """For testing: drop cached resolutions."""
    _cache.clear()


def _did_document_url(did: str, plc_directory: str) -> Optional[str]:
    if did.startswith("did:plc:"):
        return f"{plc_directory.rstrip('/')}/{did}"
    if did.startswith("did:web:"):
        rest = did[len("did:web:"):]
        segments = [_decode(s) for s in rest.split(":")]
        if not segments or not segments[0]:
            return None
        domain = segments[0]
        path = "/" + "/".join(segments[1:]) if len(segments) > 1 else ""
        return f"https://{domain}{path}/.well-known/did.json"
    return None


def _decode(s: str) -> str:
    from urllib.parse import unquote

    return unquote(s)


def _extract_pds_endpoint(doc: dict, did: str) -> Optional[str]:
    want_ids = {"#atproto_pds", f"{did}#atproto_pds"}
    for s in doc.get("service", []) or []:
        if not isinstance(s, dict):
            continue
        if s.get("id") in want_ids or s.get("type") == "AtprotoPersonalDataServer":
            ep = s.get("serviceEndpoint")
            if isinstance(ep, str):
                return ep
            if isinstance(ep, dict) and isinstance(ep.get("uri"), str):
                return ep["uri"]
    return None
