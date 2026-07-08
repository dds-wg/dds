"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/algorithm.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

__all__ = ["Main", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.algorithm#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.algorithm", alias="$type")
    schemaVersion: Optional[str] = None
    name: str
    description: Optional[str] = None
    creator: str
    metadata: Optional[str] = None  # JSON-encoded parameters of this algorithm instance.
    createdAt: str

Record = Main
