"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/project.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["Main", "ParticipationRule", "Phase", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.project#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.project", alias="$type")
    schemaVersion: Optional[str] = None
    name: str
    description: Optional[str] = None
    creator: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    phases: list[Phase]
    createdAt: str

Record = Main

class Phase(BaseModel):
    """An ordered phase within a project. Phases are embedded by value in the project record."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.project#phase", alias="$type")
    name: str
    order: int
    status: str
    allowedSubjects: Optional[list[str]] = None
    participation: Optional[ParticipationRule] = None

class ParticipationRule(BaseModel):
    """Generated from org.dds-wg.v1.project#ParticipationRule."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.project#participationRule", alias="$type")
    mode: str
    invitedAgents: Optional[list[str]] = None
    selectionAlgorithm: Optional[_repo_strong_ref.Main] = None
    quota: Optional[str] = None  # JSON-encoded quota specification.
