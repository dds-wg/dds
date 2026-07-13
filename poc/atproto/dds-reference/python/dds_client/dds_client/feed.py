"""Feed consumer. Mirrors `packages/client-ts/src/feed.ts`.

`subscribe()` yields DDS records via Jetstream, optionally preceded by a PDS catch-up
pass for the requested (DID, collection) pairs.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime
from typing import AsyncIterator, Optional

import httpx
import websockets

from .version import COLLECTIONS


@dataclass
class DDSFeedEvent:
    source: str  # "jetstream" | "catchup"
    did: str
    collection: str
    rkey: str
    uri: str
    cid: Optional[str]
    time_ms: float
    record: dict


JETSTREAM_DEFAULT = "wss://jetstream1.us-east.bsky.network/subscribe"
APPVIEW_DEFAULT = "https://bsky.social"


async def _catchup(
    *,
    since: datetime,
    dids: list[str],
    collections: list[str],
    service: str,
    logger,
) -> AsyncIterator[DDSFeedEvent]:
    since_ms = since.timestamp() * 1000
    async with httpx.AsyncClient(base_url=service, timeout=30.0) as http:
        for did in dids:
            for collection in collections:
                cursor: Optional[str] = None
                while True:
                    params = {"repo": did, "collection": collection, "limit": 100}
                    if cursor:
                        params["cursor"] = cursor
                    try:
                        resp = await http.get("/xrpc/com.atproto.repo.listRecords", params=params)
                        resp.raise_for_status()
                        body = resp.json()
                    except Exception as exc:
                        logger(f"catchup error did={did} collection={collection}: {exc}")
                        break
                    for r in body.get("records", []):
                        val = r.get("value") or {}
                        created = val.get("createdAt")
                        try:
                            ts = datetime.fromisoformat(created.replace("Z", "+00:00")).timestamp() * 1000
                        except Exception:
                            continue
                        if ts < since_ms:
                            continue
                        uri = r["uri"]
                        parts = uri.replace("at://", "").split("/", 2)
                        if len(parts) != 3:
                            continue
                        yield DDSFeedEvent(
                            source="catchup",
                            did=parts[0],
                            collection=parts[1],
                            rkey=parts[2],
                            uri=uri,
                            cid=r.get("cid"),
                            time_ms=ts,
                            record=val,
                        )
                    cursor = body.get("cursor")
                    if not cursor:
                        break


async def subscribe(
    *,
    collections: Optional[list[str]] = None,
    dids: Optional[list[str]] = None,
    cursor_us: Optional[int] = None,
    catchup_since: Optional[datetime] = None,
    catchup_service: str = APPVIEW_DEFAULT,
    jetstream_endpoint: str = JETSTREAM_DEFAULT,
    logger=lambda msg: None,
    stop_event: Optional[asyncio.Event] = None,
) -> AsyncIterator[DDSFeedEvent]:
    """Yield DDS records, catch-up first then live via Jetstream.

    Set `stop_event.set()` to cleanly stop the iterator.
    """
    cols = collections or COLLECTIONS.all()

    if catchup_since and dids:
        async for ev in _catchup(
            since=catchup_since, dids=dids, collections=cols, service=catchup_service, logger=logger
        ):
            yield ev

    params = []
    for c in cols:
        params.append(("wantedCollections", c))
    for d in dids or []:
        params.append(("wantedDids", d))
    if cursor_us is not None:
        params.append(("cursor", str(cursor_us)))
    qs = "&".join(f"{k}={v}" for k, v in params)
    url = f"{jetstream_endpoint}?{qs}" if qs else jetstream_endpoint

    logger(f"DDS feed: connecting to {url}")
    async for ws in websockets.connect(url, max_size=None):
        try:
            while not (stop_event and stop_event.is_set()):
                msg = await ws.recv()
                event = json.loads(msg)
                if event.get("kind") != "commit":
                    continue
                commit = event.get("commit") or {}
                if commit.get("operation") not in ("create", "update"):
                    continue
                rec = commit.get("record")
                if not isinstance(rec, dict):
                    continue
                did = event["did"]
                collection = commit["collection"]
                rkey = commit["rkey"]
                yield DDSFeedEvent(
                    source="jetstream",
                    did=did,
                    collection=collection,
                    rkey=rkey,
                    uri=f"at://{did}/{collection}/{rkey}",
                    cid=commit.get("cid"),
                    time_ms=event.get("time_us", 0) / 1000,
                    record=rec,
                )
            if stop_event and stop_event.is_set():
                await ws.close()
                return
        except websockets.ConnectionClosed:
            if stop_event and stop_event.is_set():
                return
            logger("DDS feed: connection closed, reconnecting...")
            continue
