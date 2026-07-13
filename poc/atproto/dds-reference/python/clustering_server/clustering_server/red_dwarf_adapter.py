"""Pluggable analysis backend.

We isolate red-dwarf behind a small protocol so:
  - the rest of the service doesn't depend on red-dwarf import-time
  - we can ship a pure-Python fallback that produces a meaningful (if naïve) clustering
    result when red-dwarf isn't installed
  - tests can swap in a fake

The fallback uses scikit-learn's KMeans over a vote matrix. The real red-dwarf integration
should reuse Polis's group-aware information consensus + group identity metrics.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol

import numpy as np
from sklearn.cluster import KMeans  # type: ignore[import-not-found]

log = logging.getLogger(__name__)


@dataclass
class AnalysisInput:
    statement_uris: list[str]
    voter_dids: list[str]
    # vote_matrix[voter_idx][statement_idx] in {-1, 0, 1} with NaN for "no vote"
    vote_matrix: list[list[float]]


@dataclass
class StatementMetrics:
    statement_uri: str
    agree_count: int
    disagree_count: int
    pass_count: int
    group_informed_consensus: float | None
    group_agree_rates: dict[int, float]
    """Per-group agree rate. Keys are group IDs."""


@dataclass
class Group:
    group_id: int
    name: str
    voter_dids: list[str]


@dataclass
class AnalysisOutput:
    groups: list[Group]
    statement_metrics: list[StatementMetrics]
    engine: str
    engine_version: str
    raw: dict
    """Engine-specific extra payload kept for posterity."""


class AnalysisEngine(Protocol):
    name: str
    version: str

    def run(self, input: AnalysisInput) -> AnalysisOutput: ...


class FallbackEngine:
    """KMeans-based stub. Sufficient for development; not a substitute for red-dwarf."""

    name = "fallback-kmeans"
    version = "0.1.0"

    def __init__(self, max_groups: int = 4):
        self.max_groups = max_groups

    def run(self, input: AnalysisInput) -> AnalysisOutput:
        n_voters = len(input.voter_dids)
        n_statements = len(input.statement_uris)
        if n_voters < 4 or n_statements < 2:
            # Not enough to cluster; produce a single trivial group.
            groups = [Group(group_id=0, name="All participants", voter_dids=list(input.voter_dids))]
            metrics = [
                _compute_basic_metrics(uri, idx, input, group_assignments=[0] * n_voters)
                for idx, uri in enumerate(input.statement_uris)
            ]
            return AnalysisOutput(
                groups=groups,
                statement_metrics=metrics,
                engine=self.name,
                engine_version=self.version,
                raw={"reason": "not enough participants/statements to cluster"},
            )

        # Substitute NaN with 0 for KMeans (Polis uses a similar fallback).
        matrix = np.array(input.vote_matrix, dtype=float)
        matrix = np.nan_to_num(matrix, nan=0.0)

        k = min(self.max_groups, max(2, n_voters // 5))
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = km.fit_predict(matrix)

        groups: list[Group] = []
        for gid in range(k):
            members = [d for d, lbl in zip(input.voter_dids, labels) if int(lbl) == gid]
            groups.append(Group(group_id=gid, name=f"Group {chr(ord('A') + gid)}", voter_dids=members))

        metrics = [
            _compute_basic_metrics(uri, idx, input, group_assignments=labels.tolist())
            for idx, uri in enumerate(input.statement_uris)
        ]

        return AnalysisOutput(
            groups=groups,
            statement_metrics=metrics,
            engine=self.name,
            engine_version=self.version,
            raw={"k": k, "inertia": float(km.inertia_)},
        )


def _compute_basic_metrics(
    statement_uri: str,
    statement_idx: int,
    input: AnalysisInput,
    group_assignments: list[int],
) -> StatementMetrics:
    matrix = np.array(input.vote_matrix, dtype=float)
    col = matrix[:, statement_idx]
    agree = int(np.sum(col > 0))
    disagree = int(np.sum(col < 0))
    pass_ = int(np.sum(col == 0))

    unique_groups = sorted(set(group_assignments))
    group_agree_rates: dict[int, float] = {}
    for gid in unique_groups:
        members_idx = [i for i, g in enumerate(group_assignments) if g == gid]
        if not members_idx:
            continue
        col_g = col[members_idx]
        votes = col_g[~np.isnan(col_g)] if np.issubdtype(col_g.dtype, np.floating) else col_g
        n = int(np.sum(votes != 0))
        if n == 0:
            group_agree_rates[gid] = 0.0
        else:
            group_agree_rates[gid] = float(np.sum(votes > 0)) / n if n > 0 else 0.0

    # Group informed consensus: low variance + high agreement across groups.
    if group_agree_rates:
        rates = list(group_agree_rates.values())
        gic = float(np.mean(rates) - np.std(rates))
    else:
        gic = None

    return StatementMetrics(
        statement_uri=statement_uri,
        agree_count=agree,
        disagree_count=disagree,
        pass_count=pass_,
        group_informed_consensus=gic,
        group_agree_rates=group_agree_rates,
    )


def get_engine() -> AnalysisEngine:
    """Return the best-available engine.

    Tries to import red-dwarf; falls back to FallbackEngine if unavailable.
    """
    try:
        import red_dwarf  # type: ignore[import-not-found]

        # TODO: implement a thin adapter around red-dwarf's analyse() once we know its API.
        log.info("red-dwarf %s detected but no adapter is wired up yet; using fallback engine", getattr(red_dwarf, "__version__", "unknown"))
    except ImportError:
        pass
    return FallbackEngine()
