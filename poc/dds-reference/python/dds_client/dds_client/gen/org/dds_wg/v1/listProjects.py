"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/listProjects.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["Output"]

MAIN_NSID = "org.dds-wg.v1.listProjects"

class Output(BaseModel):
    """Generated from org.dds-wg.v1.listProjects#Output."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.listProjects#output", alias="$type")
    cursor: Optional[str] = None
    projects: list[_v1_defs.RecordView]
