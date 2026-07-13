"""Jetstream replay helpers.

`replay_from_cursor` is the generic primitive: start at a unix-µs cursor, yield jetstream
events for the given collections, stop when caught up to wall-clock now.

`replay_project_step` is a thin wrapper that resolves a project's `createdAt` and filters
to events matching `(project_uri, phase)`. Other consumers (e.g. an indexer service that
wants to backfill all of a project's records regardless of phase) can call
`replay_from_cursor` directly.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime
from typing import AsyncIterator, Optional

import httpx

from .feed import DDSFeedEvent, JETSTREAM_DEFAULT, subscribe
from .identity import resolve_did_pds

log = logging.getLogger(__name__)

DEFAULT_CATCHUP_GRACE_SECONDS = 2.0
DEFAULT_APPVIEW = "https://bsky.social"


async def resolve_project_cursor(
    project_uri: str,
    *,
    service: str = DEFAULT_APPVIEW,
) -> Optional[int]:
    """Resolve a project's `createdAt` to a unix-microsecond jetstream cursor."""
    if not project_uri.startswith("at://"):
        return None
    parts = project_uri[len("at://"):].split("/")
    if len(parts) != 3:
        return None
    host_did, collection, rkey = parts

    base = (await resolve_did_pds(host_did)) or service

    async with httpx.AsyncClient(base_url=base, timeout=30.0) as http:
        try:
            resp = await http.get(
                "/xrpc/com.atproto.repo.getRecord",
                params={"repo": host_did, "collection": collection, "rkey": rkey},
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            log.warning("resolve_project_cursor: getRecord(%s) failed: %s", project_uri, exc)
            return None

    created = (data.get("value") or {}).get("createdAt")
    if not isinstance(created, str):
        return None
    try:
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        return int(dt.timestamp() * 1_000_000)
    except Exception:
        return None


def step_matches(record: dict, project_uri: str, phase: Optional[str] = None) -> bool:
    """Return True if a record's `step` field points at the given project (and phase, if given).

    If `phase` is None, only the project URI is matched (any phase).
    """
    if not record:
        return False
    step = record.get("step") or {}
    project = step.get("project") or {}
    if project.get("uri") != project_uri:
        return False
    if phase is not None and step.get("phase") != phase:
        return False
    return True


async def replay_from_cursor(
    *,
    cursor_us: int,
    collections: Optional[list[str]] = None,
    dids: Optional[list[str]] = None,
    catchup_grace_seconds: float = DEFAULT_CATCHUP_GRACE_SECONDS,
    jetstream_endpoint: str = JETSTREAM_DEFAULT,
    logger=lambda msg: None,
) -> AsyncIterator[DDSFeedEvent]:
    """Generic: yield jetstream events from a unix-µs cursor until caught up to wall-clock now.

    The cutoff is `now - catchup_grace_seconds`. Once events arrive at or beyond that timestamp
    we close the subscription and return.

    The caller can do any filtering they need (project URI, target, author...). For the common
    "events for project step X" case, see `replay_project_step`.
    """
    catchup_threshold_us = int(time.time() * 1_000_000) - int(
        catchup_grace_seconds * 1_000_000
    )

    stop_event = asyncio.Event()

    async for ev in subscribe(
        collections=collections,
        dids=dids,
        cursor_us=cursor_us,
        jetstream_endpoint=jetstream_endpoint,
        stop_event=stop_event,
        logger=logger,
    ):
        event_us = int(ev.time_ms * 1000)
        if event_us >= catchup_threshold_us:
            stop_event.set()
            break
        if ev.source != "jetstream":
            continue
        yield ev


async def replay_project_step(
    *,
    project_uri: str,
    phase: Optional[str] = None,
    collections: Optional[list[str]] = None,
    cursor_us: Optional[int] = None,
    catchup_grace_seconds: float = DEFAULT_CATCHUP_GRACE_SECONDS,
    service: str = DEFAULT_APPVIEW,
    jetstream_endpoint: str = JETSTREAM_DEFAULT,
    logger=lambda msg: None,
) -> AsyncIterator[DDSFeedEvent]:
    """Replay jetstream from the project's createdAt, yielding events matching the project step.

    If `phase` is None, any phase for the project matches (useful for project-wide backfills).
    If `cursor_us` is not provided, we resolve it from the project record's createdAt.
    """
    if cursor_us is None:
        cursor_us = await resolve_project_cursor(project_uri, service=service)
        if cursor_us is None:
            return

    async for ev in replay_from_cursor(
        cursor_us=cursor_us,
        collections=collections,
        catchup_grace_seconds=catchup_grace_seconds,
        jetstream_endpoint=jetstream_endpoint,
        logger=logger,
    ):
        if not step_matches(ev.record, project_uri, phase):
            continue
        yield ev
