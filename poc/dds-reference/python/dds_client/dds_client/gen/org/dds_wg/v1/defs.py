"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/defs.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref

__all__ = ["AlgorithmAgent", "ProjectStepRef", "RecordView", "UserAgent"]

class UserAgent(BaseModel):
    """An agent that is a real-world user, identified by their DID."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.defs#userAgent", alias="$type")
    did: str

class AlgorithmAgent(BaseModel):
    """An agent that is an algorithm instance, identified by a strong ref to an org.dds-wg.v1.algorithm record."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.defs#algorithmAgent", alias="$type")
    algorithm: _repo_strong_ref.Main

class ProjectStepRef(BaseModel):
    """Reference to a specific phase within a specific project, scoped by a strong ref to the project and the phase name."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.defs#projectStepRef", alias="$type")
    project: _repo_strong_ref.Main
    phase: str

class RecordView(BaseModel):
    """A view over a single record: its AT-URI, CID, and the unvalidated record value."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.defs#recordView", alias="$type")
    uri: str
    cid: str
    value: Any
