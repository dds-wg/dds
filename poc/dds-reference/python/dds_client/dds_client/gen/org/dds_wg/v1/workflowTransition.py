"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/workflowTransition.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref

__all__ = ["Main", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.workflowTransition#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.workflowTransition", alias="$type")
    schemaVersion: Optional[str] = None
    project: _repo_strong_ref.Main
    from_: str = Field(..., alias="from")
    to: str
    trigger: str
    createdAt: str

Record = Main
