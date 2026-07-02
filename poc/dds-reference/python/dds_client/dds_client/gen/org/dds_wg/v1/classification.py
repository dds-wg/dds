"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/classification.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["Main", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.classification#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.classification", alias="$type")
    schemaVersion: Optional[str] = None
    creator: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    subject: _repo_strong_ref.Main
    label: str
    confidence: Optional[int] = None  # Fixed-point confidence: integer in [0, 10000] representing [0.0000, 1.0000]. ATP
    createdAt: str

Record = Main
