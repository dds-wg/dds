"""Orchestrates a single analysis run: pull data from the DB, invoke the engine, persist
the run record, and (when service credentials are configured) republish the results as
DDS group + metric records.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict
from datetime import datetime, timezone

import anyio
from dds_client import DDSClient, login_with_app_password
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import db
from .config import Settings, get_settings
from .red_dwarf_adapter import AnalysisInput, get_engine

log = logging.getLogger(__name__)


async def run_analysis(session: AsyncSession, analysis_id: int) -> int:
    """Run a single analysis pass for the given analysis. Returns the new RunResult id."""
    analysis = await session.get(db.Analysis, analysis_id)
    if analysis is None:
        raise ValueError(f"no analysis with id {analysis_id}")
    log.info(
        "starting run for analysis=%s project=%s phase=%s",
        analysis_id,
        analysis.project_uri,
        analysis.phase,
    )

    stmts_res = await session.execute(
        select(db.Statement).where(db.Statement.analysis_id == analysis_id)
    )
    statements = stmts_res.scalars().all()
    votes_res = await session.execute(select(db.Vote).where(db.Vote.analysis_id == analysis_id))
    votes = votes_res.scalars().all()

    stmt_uris = [s.uri for s in statements]
    stmt_index = {uri: i for i, uri in enumerate(stmt_uris)}
    voter_dids = sorted({v.voter_did for v in votes})
    voter_index = {did: i for i, did in enumerate(voter_dids)}

    # Build vote matrix. NaN = no vote.
    matrix: list[list[float]] = [[float("nan")] * len(stmt_uris) for _ in voter_dids]
    for v in votes:
        si = stmt_index.get(v.target_uri)
        vi = voter_index.get(v.voter_did)
        if si is None or vi is None:
            continue
        matrix[vi][si] = float(v.value)

    engine = get_engine()
    result = engine.run(
        AnalysisInput(statement_uris=stmt_uris, voter_dids=voter_dids, vote_matrix=matrix)
    )

    payload = {
        "groups": [asdict(g) for g in result.groups],
        "statement_metrics": [asdict(m) for m in result.statement_metrics],
        "engine": result.engine,
        "engine_version": result.engine_version,
        "raw": result.raw,
    }
    run = db.RunResult(
        analysis_id=analysis_id,
        statement_count=len(stmt_uris),
        vote_count=len(votes),
        voter_count=len(voter_dids),
        group_count=len(result.groups),
        payload=payload,
    )
    session.add(run)
    analysis.last_run_at = datetime.now(timezone.utc).replace(tzinfo=None)
    analysis.new_events_since_run = 0
    await session.commit()
    await session.refresh(run)
    await session.refresh(analysis)

    settings = get_settings()
    if settings.service_handle and settings.service_app_password:
        try:
            new_algorithm_uri = await _republish(analysis, result, settings)
            if new_algorithm_uri and not analysis.algorithm_uri:
                analysis.algorithm_uri = new_algorithm_uri
                await session.commit()
        except Exception as exc:
            log.exception("republish failed for analysis=%s: %s", analysis_id, exc)
    else:
        log.info(
            "republish skipped for analysis=%s (no DDS_CS_SERVICE_HANDLE/APP_PASSWORD set)",
            analysis_id,
        )

    log.info(
        "run %s completed: %s groups, %s statements, %s votes",
        run.id,
        len(result.groups),
        len(stmt_uris),
        len(votes),
    )
    return run.id


async def _republish(
    analysis: db.Analysis, result, settings: Settings
) -> str | None:
    """Publish groups + statement metrics as DDS records using the service identity.

    Returns the algorithm record URI (newly created or pre-existing on the analysis row).
    Runs in a worker thread because dds_client.Client is synchronous (atproto-py).
    """

    def _do_publish() -> str:
        client: DDSClient = login_with_app_password(
            identifier=settings.service_handle,
            password=settings.service_app_password,
            service=settings.bsky_service,
        )

        # Algorithm record is created once per analysis and reused across runs.
        algorithm_uri = analysis.algorithm_uri
        if not algorithm_uri:
            alg = client.create_algorithm(
                name=result.engine,
                description=f"Clustering engine {result.engine} {result.engine_version}",
                metadata={"engine_version": result.engine_version, "raw": result.raw},
            )
            algorithm_uri = alg.uri

        step = {
            "project": {"uri": analysis.project_uri, "cid": analysis.project_cid},
            "phase": analysis.phase,
        }

        # Groups: one record per group per run. Each holds the current member DIDs.
        for group in result.groups:
            members = [
                {"$type": "org.dds-wg.v1.group#userMember", "did": did}
                for did in group.voter_dids
            ]
            client.create_group_as_algorithm(
                algorithm_uri=algorithm_uri,
                name=group.name,
                members=members,
                step=step,
            )

        # Per-statement metrics: emit all five counts plus the (optional) GIC score.
        for m in result.statement_metrics:
            subject = {"uri": m.statement_uri, "cid": ""}
            base = dict(algorithm_uri=algorithm_uri, subject=subject, step=step)
            if m.group_informed_consensus is not None:
                client.create_metric_as_algorithm(
                    name="groupInformedConsensus",
                    metric_type="groupInformedConsensus",
                    value={
                        "$type": "org.dds-wg.v1.metric#decimalValue",
                        "decimal": f"{m.group_informed_consensus:.6f}",
                    },
                    **base,
                )
            for metric_name, count in (
                ("agreeCount", m.agree_count),
                ("disagreeCount", m.disagree_count),
                ("passCount", m.pass_count),
            ):
                client.create_metric_as_algorithm(
                    name=metric_name,
                    metric_type=metric_name,
                    value={
                        "$type": "org.dds-wg.v1.metric#integerValue",
                        "integer": int(count),
                    },
                    **base,
                )
            # Per-group agree rates ride along as a JSON blob so consumers can plot them.
            if m.group_agree_rates:
                client.create_metric_as_algorithm(
                    name="groupAgreeRates",
                    metric_type="groupAgreeRates",
                    value={
                        "$type": "org.dds-wg.v1.metric#jsonValue",
                        "json": json.dumps(m.group_agree_rates),
                    },
                    **base,
                )

        return algorithm_uri

    return await anyio.to_thread.run_sync(_do_publish)
