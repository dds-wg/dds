"""Background analysis runner. Consumes analysis ids from a queue and executes runs."""

from __future__ import annotations

import asyncio
import logging

from . import db
from .analysis import run_analysis

log = logging.getLogger(__name__)


async def run_worker(stop_event: asyncio.Event, run_queue: asyncio.Queue[int]) -> None:
    while not stop_event.is_set():
        try:
            analysis_id = await asyncio.wait_for(run_queue.get(), timeout=1.0)
        except asyncio.TimeoutError:
            continue
        try:
            async with db.session() as session:
                await run_analysis(session, analysis_id)
        except Exception as exc:
            log.exception("worker: run failed for analysis=%s: %s", analysis_id, exc)
