"""SQLAlchemy models + session management.

Schema centred on three concepts:
- Analysis: an active "watch + cluster" task targeting a single DDS project step
- Statement: one row per `org.dds-wg.v1.statement` the analysis is tracking
- Vote: one row per `org.dds-wg.v1.vote` the analysis is tracking
- RunResult: the outputs of a single clustering run (group structure + metrics)
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncIterator

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .config import get_settings


class Base(DeclarativeBase):
    pass


class Analysis(Base):
    """A watch+cluster task. One per (project_uri, phase, owner_did)."""

    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_did: Mapped[str] = mapped_column(String(256), index=True)
    project_uri: Mapped[str] = mapped_column(String(512), index=True)
    project_cid: Mapped[str] = mapped_column(String(256))
    phase: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(32), default="active")  # active|paused|ended
    rerun_threshold: Mapped[int] = mapped_column(Integer, default=10)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    new_events_since_run: Mapped[int] = mapped_column(Integer, default=0)
    algorithm_uri: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Indexer-cursor checkpoints for incremental polling. NULL = start from the beginning.
    indexer_cursor_statements: Mapped[str | None] = mapped_column(String(512), nullable=True)
    indexer_cursor_votes: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    statements: Mapped[list[Statement]] = relationship(back_populates="analysis", cascade="all,delete-orphan")
    votes: Mapped[list[Vote]] = relationship(back_populates="analysis", cascade="all,delete-orphan")
    runs: Mapped[list[RunResult]] = relationship(back_populates="analysis", cascade="all,delete-orphan")

    __table_args__ = (
        UniqueConstraint("owner_did", "project_uri", "phase", name="uq_analysis_target"),
    )


class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), index=True)
    uri: Mapped[str] = mapped_column(String(512), unique=True)
    cid: Mapped[str] = mapped_column(String(256))
    author_did: Mapped[str] = mapped_column(String(256), index=True)
    text: Mapped[str] = mapped_column(String(8000))
    created_at: Mapped[datetime] = mapped_column(DateTime)

    analysis: Mapped[Analysis] = relationship(back_populates="statements")


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), index=True)
    uri: Mapped[str] = mapped_column(String(512), unique=True)
    voter_did: Mapped[str] = mapped_column(String(256), index=True)
    target_uri: Mapped[str] = mapped_column(String(512), index=True)
    # Normalized continuous value in [-1, 1] for clustering. Ordinal votes map to {-1, 0, 1}.
    value: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime)

    analysis: Mapped[Analysis] = relationship(back_populates="votes")


class RunResult(Base):
    __tablename__ = "run_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id", ondelete="CASCADE"), index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    statement_count: Mapped[int] = mapped_column(Integer)
    vote_count: Mapped[int] = mapped_column(Integer)
    voter_count: Mapped[int] = mapped_column(Integer)
    group_count: Mapped[int] = mapped_column(Integer)
    payload: Mapped[dict] = mapped_column(JSON)
    """Full output from the analysis engine. Schema is engine-specific (see red_dwarf_adapter)."""

    analysis: Mapped[Analysis] = relationship(back_populates="runs")


_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_engine():
    global _engine, _session_factory
    if _engine is not None:
        return
    settings = get_settings()
    _engine = create_async_engine(settings.database_url, echo=False, future=True)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def create_all():
    init_engine()
    assert _engine is not None
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _apply_ad_hoc_migrations(conn)


# We don't run Alembic for the POC, but we still need to ALTER existing DBs when the schema
# grows. Each entry below is an idempotent statement we attempt; failures are swallowed (they
# usually mean "column already exists"), which keeps the migration safe to re-run.
_AD_HOC_MIGRATIONS = [
    "ALTER TABLE analyses ADD COLUMN indexer_cursor_statements VARCHAR(512)",
    "ALTER TABLE analyses ADD COLUMN indexer_cursor_votes VARCHAR(512)",
]


async def _apply_ad_hoc_migrations(conn) -> None:
    from sqlalchemy import text

    for stmt in _AD_HOC_MIGRATIONS:
        try:
            await conn.execute(text(stmt))
        except Exception:
            # Already applied (or otherwise inapplicable); we don't fail startup over this.
            pass


@asynccontextmanager
async def session() -> AsyncIterator[AsyncSession]:
    init_engine()
    assert _session_factory is not None
    async with _session_factory() as sess:
        yield sess


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    init_engine()
    assert _session_factory is not None
    return _session_factory
