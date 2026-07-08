"""Indexer-polling worker.

Replaces the jetstream listener + project backfill that the clustering server used to run
itself. On each tick we walk every active analysis, fetch any new statements/votes from the
indexer since our saved cursor, insert them into the local DB, and queue an analysis run
when the new-event threshold is crossed.

This keeps the clustering server focused on its actual job (running red-dwarf) and lets the
indexer be the single source of truth for jetstream consumption.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from . import db
from .config import get_settings
from .indexer_client import IndexerClient

log = logging.getLogger(__name__)


def _parse_iso_to_dt(s: Optional[str]) -> datetime:
    if not s:
        return datetime.utcnow()
    try:
        # Indexer ISO timestamps are like "2026-06-27T20:57:42.963Z"
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()


def _to_continuous(vote_value: dict | None) -> Optional[float]:
    """Normalize any DDS vote value-shape into a float in [-1, 1] for clustering."""
    if not vote_value:
        return None
    t = vote_value.get("$type", "")
    if t == "org.dds-wg.v1.vote#ordinal":
        v = vote_value.get("value")
        return float(v) if isinstance(v, (int, float)) else None
    if t == "org.dds-wg.v1.vote#continuous":
        v = vote_value.get("value")
        return float(v) / 10000.0 if isinstance(v, (int, float)) else None
    if t == "org.dds-wg.v1.vote#approval":
        return 1.0 if vote_value.get("approve") else -1.0
    return None


async def _active_analyses(session: AsyncSession) -> list[db.Analysis]:
    res = await session.execute(select(db.Analysis).where(db.Analysis.status == "active"))
    return list(res.scalars().all())


async def _insert_statement(
    session: AsyncSession, analysis: db.Analysis, rec: dict[str, Any]
) -> bool:
    value = (rec.get("value") or {}) if isinstance(rec.get("value"), dict) else {}
    if not isinstance(value, dict):
        return False
    existing = await session.execute(
        select(db.Statement).where(db.Statement.uri == rec["uri"])
    )
    if existing.scalar_one_or_none():
        return False
    author_did = (value.get("author") or {}).get("did") or rec.get("did", "")
    stmt = db.Statement(
        analysis_id=analysis.id,
        uri=rec["uri"],
        cid=rec.get("cid") or "",
        author_did=author_did,
        text=str(value.get("text", ""))[:8000],
        created_at=_parse_iso_to_dt(rec.get("recordCreatedAt")),
    )
    session.add(stmt)
    try:
        await session.flush()
        return True
    except IntegrityError:
        await session.rollback()
        return False


async def _insert_vote(
    session: AsyncSession, analysis: db.Analysis, rec: dict[str, Any]
) -> bool:
    value = (rec.get("value") or {}) if isinstance(rec.get("value"), dict) else {}
    if not isinstance(value, dict):
        return False
    target_uri = rec.get("targetUri") or ((value.get("target") or {}).get("uri") or "")
    if not target_uri:
        return False
    norm = _to_continuous(value.get("value") or {})
    if norm is None:
        return False
    existing = await session.execute(select(db.Vote).where(db.Vote.uri == rec["uri"]))
    if existing.scalar_one_or_none():
        return False
    voter_did = (value.get("author") or {}).get("did") or rec.get("did", "")
    vote = db.Vote(
        analysis_id=analysis.id,
        uri=rec["uri"],
        voter_did=voter_did,
        target_uri=target_uri,
        value=norm,
        created_at=_parse_iso_to_dt(rec.get("recordCreatedAt")),
    )
    session.add(vote)
    try:
        await session.flush()
        return True
    except IntegrityError:
        await session.rollback()
        return False


async def _poll_once(
    client: IndexerClient,
    analysis_id: int,
    run_queue: asyncio.Queue[int],
) -> int:
    """Poll the indexer for one analysis. Returns the number of new rows added."""
    async with db.session() as session:
        a = await session.get(db.Analysis, analysis_id)
        if a is None or a.status != "active":
            return 0
        project_uri = a.project_uri
        phase = a.phase
        stmt_cursor = a.indexer_cursor_statements
        vote_cursor = a.indexer_cursor_votes

    new_statements, next_stmt_cursor = await client.list_all_statements_since(
        project=project_uri, phase=phase, cursor=stmt_cursor
    )
    new_votes, next_vote_cursor = await client.list_all_votes_since(
        project=project_uri, phase=phase, cursor=vote_cursor
    )

    if not new_statements and not new_votes:
        # Even with nothing new, persist the (possibly advanced) cursor.
        if next_stmt_cursor != stmt_cursor or next_vote_cursor != vote_cursor:
            async with db.session() as session:
                a = await session.get(db.Analysis, analysis_id)
                if a is not None:
                    a.indexer_cursor_statements = next_stmt_cursor
                    a.indexer_cursor_votes = next_vote_cursor
                    await session.commit()
        return 0

    added = 0
    async with db.session() as session:
        a = await session.get(db.Analysis, analysis_id)
        if a is None:
            return 0
        for rec in new_statements:
            if await _insert_statement(session, a, rec):
                added += 1
        for rec in new_votes:
            if await _insert_vote(session, a, rec):
                added += 1
        a.indexer_cursor_statements = next_stmt_cursor
        a.indexer_cursor_votes = next_vote_cursor
        a.new_events_since_run += added
        await session.commit()
        await session.refresh(a)
        should_run = a.new_events_since_run >= a.rerun_threshold

    if should_run:
        await run_queue.put(analysis_id)
        log.info(
            "queued analysis=%s for rerun (events=%s threshold reached)",
            analysis_id,
            added,
        )
    return added


async def run_poller(
    stop_event: asyncio.Event,
    run_queue: asyncio.Queue[int],
) -> None:
    """Poll the indexer once per `poll_interval_seconds`, processing every active analysis."""
    settings = get_settings()
    client = IndexerClient(settings.indexer_url)

    # Wait briefly for the indexer to come up; non-fatal if it's still not there.
    for attempt in range(30):
        if await client.health():
            break
        if stop_event.is_set():
            return
        await asyncio.sleep(2)
    else:
        log.warning(
            "poller: indexer at %s never reported healthy; will keep trying",
            settings.indexer_url,
        )

    while not stop_event.is_set():
        try:
            async with db.session() as session:
                analyses = await _active_analyses(session)
            for a in analyses:
                if stop_event.is_set():
                    break
                try:
                    added = await _poll_once(client, a.id, run_queue)
                    if added:
                        log.info("poller: analysis=%s ingested %s new records", a.id, added)
                except Exception:
                    log.exception("poller: error polling analysis=%s", a.id)
        except Exception:
            log.exception("poller: tick errored")
        await asyncio.sleep(settings.indexer_poll_interval_seconds)


async def kickoff_backfill(project_uri: str) -> None:
    """One-shot: ask the indexer to do a jetstream replay for this project so historical
    statements/votes are visible to our subsequent polls."""
    settings = get_settings()
    client = IndexerClient(settings.indexer_url)
    try:
        await client.trigger_backfill(project_uri)
    except Exception as exc:
        log.warning("backfill kick-off for %s failed: %s", project_uri, exc)
