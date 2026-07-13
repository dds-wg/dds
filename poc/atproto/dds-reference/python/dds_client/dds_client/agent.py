"""DDSClient: high-level wrapper around an authenticated atproto.Client.

Mirrors `packages/client-ts/src/agent.ts`.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

from atproto import Client
from atproto_client.models import dot_dict

from .version import COLLECTIONS, LEXICON_VERSION


@dataclass(frozen=True)
class CreateRecordResult:
    uri: str
    cid: str


@dataclass(frozen=True)
class ParsedAtUri:
    repo: str
    collection: str
    rkey: str


def parse_at_uri(uri: str) -> ParsedAtUri:
    if not uri.startswith("at://"):
        raise ValueError(f"Not an at:// URI: {uri}")
    parts = uri[len("at://"):].split("/")
    if len(parts) != 3 or not all(parts):
        raise ValueError(f"Malformed AT-URI: {uri}")
    return ParsedAtUri(repo=parts[0], collection=parts[1], rkey=parts[2])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class DDSClient:
    """High-level, typed wrapper around an authenticated `atproto.Client`.

    Mutations are scoped to the authenticated repo (the session's DID). Reads
    accept an explicit `repo` or default to the session's DID.
    """

    def __init__(self, client: Client):
        self.client = client

    @property
    def did(self) -> Optional[str]:
        return getattr(self.client.me, "did", None) if self.client.me else None

    def _require_did(self) -> str:
        d = self.did
        if d is None:
            raise RuntimeError("DDSClient: no authenticated session")
        return d

    def _user_agent_self(self) -> dict[str, Any]:
        return {"$type": "org.dds-wg.v1.defs#userAgent", "did": self._require_did()}

    def _create_record(self, collection: str, record: dict[str, Any]) -> CreateRecordResult:
        repo = self._require_did()
        full = {"schemaVersion": LEXICON_VERSION, "createdAt": _now_iso(), **record}
        # atproto.Client wraps com.atproto.repo.createRecord
        resp = self.client.com.atproto.repo.create_record(
            data={"repo": repo, "collection": collection, "record": dot_dict.DotDict(full)},
        )
        return CreateRecordResult(uri=resp.uri, cid=resp.cid)

    # ---------------- record creation ----------------

    def create_statement(
        self,
        *,
        text: str,
        reply_to: Optional[dict[str, Any]] = None,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.statement,
            "text": text,
            "author": self._user_agent_self(),
            **({"replyTo": reply_to} if reply_to else {}),
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.statement, record)

    def create_ordinal_vote(
        self,
        *,
        target: dict[str, Any],
        value: int,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        if value not in (-1, 0, 1):
            raise ValueError("ordinal vote value must be -1, 0, or 1")
        record = {
            "$type": COLLECTIONS.vote,
            "author": self._user_agent_self(),
            "target": target,
            "value": {"$type": "org.dds-wg.v1.vote#ordinal", "value": value},
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.vote, record)

    def create_continuous_vote(
        self,
        *,
        target: dict[str, Any],
        value: float,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        if not -1.0 <= value <= 1.0:
            raise ValueError("continuous vote value must be in [-1, 1]")
        fixed = round(value * 10000)
        record = {
            "$type": COLLECTIONS.vote,
            "author": self._user_agent_self(),
            "target": target,
            "value": {"$type": "org.dds-wg.v1.vote#continuous", "value": fixed},
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.vote, record)

    def create_proposal(
        self,
        *,
        name: str,
        description: Optional[str] = None,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.proposal,
            "name": name,
            "creator": self._user_agent_self(),
            **({"description": description} if description else {}),
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.proposal, record)

    def create_decision(
        self,
        *,
        name: str,
        summary: str,
        accepted_proposals: Optional[list[dict[str, Any]]] = None,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.decision,
            "name": name,
            "summary": summary,
            "creator": self._user_agent_self(),
            **({"acceptedProposals": accepted_proposals} if accepted_proposals else {}),
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.decision, record)

    def create_summary(
        self,
        *,
        name: str,
        description: str,
        subject: dict[str, Any],
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.summary,
            "name": name,
            "description": description,
            "creator": self._user_agent_self(),
            "subject": subject,
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.summary, record)

    def create_response(self, *, text: str, target: dict[str, Any]) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.response,
            "text": text,
            "target": target,
            "author": self._user_agent_self(),
        }
        return self._create_record(COLLECTIONS.response, record)

    def create_group(
        self,
        *,
        members: list[dict[str, Any]],
        name: Optional[str] = None,
        description: Optional[str] = None,
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.group,
            "creator": self._user_agent_self(),
            "members": members,
            **({"name": name} if name else {}),
            **({"description": description} if description else {}),
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.group, record)

    def create_metric(
        self,
        *,
        name: str,
        metric_type: str,
        subject: dict[str, Any],
        value: dict[str, Any],
        step: Optional[dict[str, Any]] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.metric,
            "name": name,
            "creator": self._user_agent_self(),
            "metricType": metric_type,
            "value": value,
            "subject": subject,
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.metric, record)

    # ---------------- algorithm-authored variants ----------------
    #
    # These are used by services like the clustering server, where the `creator` of a record is
    # an algorithm instance rather than the authenticated user. The session is still the user's
    # (since AT Protocol writes are signed by an account), but the in-record `creator` shape is
    # the `algorithmAgent` union variant referencing an `org.dds-wg.v1.algorithm` record.

    @staticmethod
    def _algorithm_agent(algorithm_uri: str, algorithm_cid: str = "") -> dict[str, Any]:
        return {
            "$type": "org.dds-wg.v1.defs#algorithmAgent",
            "algorithm": {"uri": algorithm_uri, "cid": algorithm_cid},
        }

    def create_group_as_algorithm(
        self,
        *,
        algorithm_uri: str,
        members: list[dict[str, Any]],
        name: Optional[str] = None,
        description: Optional[str] = None,
        step: Optional[dict[str, Any]] = None,
        algorithm_cid: str = "",
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.group,
            "creator": self._algorithm_agent(algorithm_uri, algorithm_cid),
            "members": members,
            **({"name": name} if name else {}),
            **({"description": description} if description else {}),
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.group, record)

    def create_metric_as_algorithm(
        self,
        *,
        algorithm_uri: str,
        name: str,
        metric_type: str,
        subject: dict[str, Any],
        value: dict[str, Any],
        step: Optional[dict[str, Any]] = None,
        algorithm_cid: str = "",
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.metric,
            "name": name,
            "creator": self._algorithm_agent(algorithm_uri, algorithm_cid),
            "metricType": metric_type,
            "value": value,
            "subject": subject,
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.metric, record)

    def create_summary_as_algorithm(
        self,
        *,
        algorithm_uri: str,
        name: str,
        description: str,
        subject: dict[str, Any],
        step: Optional[dict[str, Any]] = None,
        algorithm_cid: str = "",
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.summary,
            "name": name,
            "description": description,
            "creator": self._algorithm_agent(algorithm_uri, algorithm_cid),
            "subject": subject,
            **({"step": step} if step else {}),
        }
        return self._create_record(COLLECTIONS.summary, record)

    def create_classification_as_algorithm(
        self,
        *,
        algorithm_uri: str,
        subject: dict[str, Any],
        label: str,
        confidence: Optional[float] = None,
        algorithm_cid: str = "",
    ) -> CreateRecordResult:
        record: dict[str, Any] = {
            "$type": COLLECTIONS.classification,
            "creator": self._algorithm_agent(algorithm_uri, algorithm_cid),
            "subject": subject,
            "label": label,
        }
        if confidence is not None:
            if not 0.0 <= confidence <= 1.0:
                raise ValueError("confidence must be in [0, 1]")
            record["confidence"] = round(confidence * 10000)
        return self._create_record(COLLECTIONS.classification, record)

    # ---------------- end algorithm variants ----------------

    def create_classification(
        self,
        *,
        subject: dict[str, Any],
        label: str,
        confidence: Optional[float] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.classification,
            "creator": self._user_agent_self(),
            "subject": subject,
            "label": label,
        }
        if confidence is not None:
            if not 0.0 <= confidence <= 1.0:
                raise ValueError("confidence must be in [0, 1]")
            record["confidence"] = round(confidence * 10000)
        return self._create_record(COLLECTIONS.classification, record)

    def create_algorithm(
        self,
        *,
        name: str,
        description: Optional[str] = None,
        metadata: Optional[Any] = None,
    ) -> CreateRecordResult:
        import json

        record: dict[str, Any] = {
            "$type": COLLECTIONS.algorithm,
            "name": name,
            "creator": self._require_did(),
        }
        if description:
            record["description"] = description
        if metadata is not None:
            record["metadata"] = json.dumps(metadata)
        return self._create_record(COLLECTIONS.algorithm, record)

    def create_project(
        self,
        *,
        name: str,
        phases: list[dict[str, Any]],
        description: Optional[str] = None,
    ) -> CreateRecordResult:
        record = {
            "$type": COLLECTIONS.project,
            "name": name,
            "creator": self._user_agent_self(),
            "phases": phases,
            **({"description": description} if description else {}),
        }
        return self._create_record(COLLECTIONS.project, record)

    # ---------------- queries ----------------

    def list_records(
        self,
        *,
        collection: str,
        repo: Optional[str] = None,
        limit: int = 50,
        cursor: Optional[str] = None,
    ) -> tuple[Optional[str], list[dict[str, Any]]]:
        repo_did = repo or self._require_did()
        resp = self.client.com.atproto.repo.list_records(
            params={"repo": repo_did, "collection": collection, "limit": limit, "cursor": cursor},
        )
        records = [
            {"uri": r.uri, "cid": r.cid, "value": dict(r.value) if hasattr(r.value, "__iter__") else r.value}
            for r in resp.records
        ]
        return resp.cursor, records

    def get_record(self, uri: str) -> dict[str, Any]:
        parsed = parse_at_uri(uri)
        resp = self.client.com.atproto.repo.get_record(
            params={"repo": parsed.repo, "collection": parsed.collection, "rkey": parsed.rkey},
        )
        return {"uri": resp.uri, "cid": getattr(resp, "cid", "") or "", "value": resp.value}

    def list_projects(self, *, repo: Optional[str] = None, limit: int = 50, cursor: Optional[str] = None):
        return self.list_records(collection=COLLECTIONS.project, repo=repo, limit=limit, cursor=cursor)

    def list_statements(self, *, repo: Optional[str] = None, limit: int = 50, cursor: Optional[str] = None):
        return self.list_records(collection=COLLECTIONS.statement, repo=repo, limit=limit, cursor=cursor)

    def list_votes(self, *, repo: Optional[str] = None, limit: int = 50, cursor: Optional[str] = None):
        return self.list_records(collection=COLLECTIONS.vote, repo=repo, limit=limit, cursor=cursor)
