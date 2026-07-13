"""Async HTTP client for the @dds/indexer service.

Used by the clustering server's polling worker to fetch new statements/votes since the last
poll for each active analysis. The indexer's response always carries a `cursor` pointing to
"the last record returned"; we save that between polls and use it as the `since` argument on
the next call.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

log = logging.getLogger(__name__)


@dataclass
class IndexerPage:
    items: list[dict[str, Any]]
    cursor: Optional[str]


class IndexerClient:
    def __init__(self, base_url: str, timeout_seconds: float = 15.0):
        self.base_url = base_url.rstrip("/")
        self._timeout = timeout_seconds

    async def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        # `httpx.params` drops Nones implicitly when we pass cleaned dict
        cleaned = {k: v for k, v in params.items() if v is not None}
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self._timeout) as http:
            resp = await http.get(path, params=cleaned)
            resp.raise_for_status()
            return resp.json()

    async def page_statements(
        self,
        *,
        project: str,
        phase: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: int = 100,
    ) -> IndexerPage:
        data = await self._get(
            "/api/statements",
            {"project": project, "phase": phase, "cursor": cursor, "limit": limit},
        )
        return IndexerPage(items=data.get("items", []), cursor=data.get("cursor"))

    async def page_votes(
        self,
        *,
        project: str,
        phase: Optional[str] = None,
        cursor: Optional[str] = None,
        limit: int = 100,
    ) -> IndexerPage:
        data = await self._get(
            "/api/votes",
            {"project": project, "phase": phase, "cursor": cursor, "limit": limit},
        )
        return IndexerPage(items=data.get("items", []), cursor=data.get("cursor"))

    async def list_all_statements_since(
        self,
        *,
        project: str,
        phase: Optional[str],
        cursor: Optional[str],
        page_size: int = 100,
    ) -> tuple[list[dict[str, Any]], Optional[str]]:
        """Walk pages from `cursor` and return (all_items, new_cursor)."""
        return await self._walk_pages(
            self.page_statements, project=project, phase=phase, cursor=cursor, limit=page_size
        )

    async def list_all_votes_since(
        self,
        *,
        project: str,
        phase: Optional[str],
        cursor: Optional[str],
        page_size: int = 100,
    ) -> tuple[list[dict[str, Any]], Optional[str]]:
        return await self._walk_pages(
            self.page_votes, project=project, phase=phase, cursor=cursor, limit=page_size
        )

    async def _walk_pages(
        self,
        fn,
        *,
        project: str,
        phase: Optional[str],
        cursor: Optional[str],
        limit: int,
    ) -> tuple[list[dict[str, Any]], Optional[str]]:
        out: list[dict[str, Any]] = []
        last_cursor = cursor
        while True:
            page = await fn(project=project, phase=phase, cursor=last_cursor, limit=limit)
            out.extend(page.items)
            if page.cursor is not None:
                last_cursor = page.cursor
            # The indexer returns an underfull page when there's no more data; that's our exit
            # condition. The cursor still advances, so we keep it for the next poll.
            if len(page.items) < limit:
                break
            if page.cursor is None:
                break
        return out, last_cursor

    async def trigger_backfill(self, project_uri: str) -> dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=self._timeout) as http:
            resp = await http.post(
                "/api/projects/backfill", json={"projectUri": project_uri}
            )
            resp.raise_for_status()
            return resp.json()

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=self._timeout) as http:
                resp = await http.get("/api/health")
                resp.raise_for_status()
                data = resp.json()
                return data.get("status") == "ok"
        except Exception as exc:
            log.warning("indexer health check failed: %s", exc)
            return False
