"""FastAPI app + lifespan that wires the indexer poller and the analysis worker."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import db
from .analysis import run_analysis
from .config import get_settings
from .poller import kickoff_backfill, run_poller
from .worker import run_worker

log = logging.getLogger("clustering_server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    await db.create_all()
    stop_event = asyncio.Event()
    run_queue: asyncio.Queue[int] = asyncio.Queue()
    poller_task = asyncio.create_task(run_poller(stop_event, run_queue))
    worker_task = asyncio.create_task(run_worker(stop_event, run_queue))
    app.state.run_queue = run_queue
    try:
        yield
    finally:
        stop_event.set()
        await asyncio.gather(poller_task, worker_task, return_exceptions=True)


app = FastAPI(title="DDS Clustering Server", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------- DTOs --------


class AnalysisCreate(BaseModel):
    owner_did: str
    project_uri: str
    project_cid: str
    phase: str
    rerun_threshold: Optional[int] = None


class AnalysisUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(active|paused|ended)$")
    rerun_threshold: Optional[int] = Field(default=None, ge=1, le=10000)


class AnalysisView(BaseModel):
    id: int
    owner_did: str
    project_uri: str
    project_cid: str
    phase: str
    status: str
    rerun_threshold: int
    last_run_at: Optional[datetime]
    new_events_since_run: int
    algorithm_uri: Optional[str]
    statement_count: int
    vote_count: int
    created_at: datetime

    @classmethod
    def from_orm(cls, a: db.Analysis, statement_count: int, vote_count: int) -> "AnalysisView":
        return cls(
            id=a.id,
            owner_did=a.owner_did,
            project_uri=a.project_uri,
            project_cid=a.project_cid,
            phase=a.phase,
            status=a.status,
            rerun_threshold=a.rerun_threshold,
            last_run_at=a.last_run_at,
            new_events_since_run=a.new_events_since_run,
            algorithm_uri=a.algorithm_uri,
            statement_count=statement_count,
            vote_count=vote_count,
            created_at=a.created_at,
        )


class RunResultView(BaseModel):
    id: int
    completed_at: datetime
    statement_count: int
    vote_count: int
    voter_count: int
    group_count: int
    payload: dict


# -------- Helpers --------


async def get_session() -> AsyncSession:
    async with db.session() as s:
        yield s


async def _load_analysis(session: AsyncSession, analysis_id: int) -> db.Analysis:
    a = await session.get(db.Analysis, analysis_id)
    if a is None:
        raise HTTPException(status_code=404, detail="analysis not found")
    return a


async def _counts(session: AsyncSession, analysis_id: int) -> tuple[int, int]:
    from sqlalchemy import func

    sc = (await session.execute(
        select(func.count(db.Statement.id)).where(db.Statement.analysis_id == analysis_id)
    )).scalar_one()
    vc = (await session.execute(
        select(func.count(db.Vote.id)).where(db.Vote.analysis_id == analysis_id)
    )).scalar_one()
    return int(sc), int(vc)


# -------- Routes --------


@app.get("/api/analyses", response_model=list[AnalysisView])
async def list_analyses(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(db.Analysis).order_by(db.Analysis.created_at.desc()))
    out: list[AnalysisView] = []
    for a in res.scalars().all():
        sc, vc = await _counts(session, a.id)
        out.append(AnalysisView.from_orm(a, sc, vc))
    return out


@app.post("/api/analyses", response_model=AnalysisView, status_code=201)
async def create_analysis(body: AnalysisCreate, session: AsyncSession = Depends(get_session)):
    settings = get_settings()
    a = db.Analysis(
        owner_did=body.owner_did,
        project_uri=body.project_uri,
        project_cid=body.project_cid,
        phase=body.phase,
        rerun_threshold=body.rerun_threshold or settings.default_rerun_threshold,
    )
    session.add(a)
    try:
        await session.commit()
    except Exception as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail=f"analysis already exists: {exc}")
    await session.refresh(a)

    # Ask the indexer to do a one-shot jetstream replay from this project's createdAt. Once
    # the indexer has historical records, our polling worker will pull them in and queue a
    # run when the new-event threshold is reached.
    asyncio.create_task(kickoff_backfill(a.project_uri))

    return AnalysisView.from_orm(a, 0, 0)


@app.post("/api/analyses/{analysis_id}/backfill")
async def trigger_backfill(analysis_id: int, session: AsyncSession = Depends(get_session)):
    """Re-trigger the indexer's project backfill for this analysis. Idempotent on the indexer side."""
    a = await _load_analysis(session, analysis_id)
    await kickoff_backfill(a.project_uri)
    return {"status": "indexer backfill triggered", "projectUri": a.project_uri}


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisView)
async def get_analysis(analysis_id: int, session: AsyncSession = Depends(get_session)):
    a = await _load_analysis(session, analysis_id)
    sc, vc = await _counts(session, a.id)
    return AnalysisView.from_orm(a, sc, vc)


@app.patch("/api/analyses/{analysis_id}", response_model=AnalysisView)
async def update_analysis(
    analysis_id: int,
    body: AnalysisUpdate,
    session: AsyncSession = Depends(get_session),
):
    a = await _load_analysis(session, analysis_id)
    if body.status is not None:
        a.status = body.status
    if body.rerun_threshold is not None:
        a.rerun_threshold = body.rerun_threshold
    await session.commit()
    await session.refresh(a)
    sc, vc = await _counts(session, a.id)
    return AnalysisView.from_orm(a, sc, vc)


@app.post("/api/analyses/{analysis_id}/run", response_model=RunResultView)
async def trigger_run(analysis_id: int, session: AsyncSession = Depends(get_session)):
    """Run an analysis immediately (synchronously, in-request)."""
    a = await _load_analysis(session, analysis_id)
    if a.status != "active":
        raise HTTPException(status_code=409, detail=f"analysis is not active (status={a.status})")
    run_id = await run_analysis(session, analysis_id)
    run = await session.get(db.RunResult, run_id)
    assert run is not None
    return RunResultView(
        id=run.id,
        completed_at=run.completed_at,
        statement_count=run.statement_count,
        vote_count=run.vote_count,
        voter_count=run.voter_count,
        group_count=run.group_count,
        payload=run.payload,
    )


@app.get("/api/analyses/{analysis_id}/runs", response_model=list[RunResultView])
async def list_runs(analysis_id: int, session: AsyncSession = Depends(get_session)):
    await _load_analysis(session, analysis_id)
    res = await session.execute(
        select(db.RunResult)
        .where(db.RunResult.analysis_id == analysis_id)
        .order_by(db.RunResult.completed_at.desc())
        .limit(50)
    )
    return [
        RunResultView(
            id=r.id,
            completed_at=r.completed_at,
            statement_count=r.statement_count,
            vote_count=r.vote_count,
            voter_count=r.voter_count,
            group_count=r.group_count,
            payload=r.payload,
        )
        for r in res.scalars().all()
    ]


@app.get("/api/health")
async def health():
    return {"status": "ok"}
