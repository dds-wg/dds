"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/statement.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["Main", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.statement#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.statement", alias="$type")
    schemaVersion: Optional[str] = None  # Optional semver of the record's minor/patch schema within the v1 major (e.g. '1.
    text: str
    author: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    replyTo: Optional[_repo_strong_ref.Main] = None
    step: Optional[_v1_defs.ProjectStepRef] = None
    createdAt: str

Record = Main
