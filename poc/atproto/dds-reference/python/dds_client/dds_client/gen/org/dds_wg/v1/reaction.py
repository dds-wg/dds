"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/reaction.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs
from dds_client.gen.org.dds_wg.v1 import response as _v1_response
from dds_client.gen.org.dds_wg.v1 import vote as _v1_vote

__all__ = ["Main", "Record"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.reaction#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.reaction", alias="$type")
    schemaVersion: Optional[str] = None
    author: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    reaction: Union[_v1_vote.Main, _v1_response.Main]
    createdAt: str

Record = Main
