"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/vote.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["Approval", "Continuous", "Main", "Ordinal", "Quadratic", "Ranked", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.vote#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote", alias="$type")
    schemaVersion: Optional[str] = None
    author: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    target: _repo_strong_ref.Main
    value: Union[Ordinal, Continuous, Quadratic, Approval, Ranked]
    step: Optional[_v1_defs.ProjectStepRef] = None
    createdAt: str

Record = Main

class Ordinal(BaseModel):
    """Polis-style trinary vote: -1 disagree, 0 pass, +1 agree."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote#ordinal", alias="$type")
    value: int

class Continuous(BaseModel):
    """A continuous-valued vote represented as fixed-point integer in [-10000, 10000] (= [-1.0, 1.0] with 4 decimal places). ATProto lexicon does not support native floats."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote#continuous", alias="$type")
    value: int

class Quadratic(BaseModel):
    """Quadratic voting: an integer number of credits (can be negative)."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote#quadratic", alias="$type")
    credits: int

class Approval(BaseModel):
    """Boolean approval vote."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote#approval", alias="$type")
    approve: bool

class Ranked(BaseModel):
    """A ranked vote that orders subject URIs by preference (most preferred first)."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.vote#ranked", alias="$type")
    order: list[str]
