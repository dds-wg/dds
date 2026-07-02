"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/group.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["GroupMember", "Main", "Record", "StatementMember", "UserMember"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.group#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.group", alias="$type")
    schemaVersion: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    creator: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    members: list[Union[StatementMember, UserMember, GroupMember]]
    step: Optional[_v1_defs.ProjectStepRef] = None
    createdAt: str

Record = Main

class StatementMember(BaseModel):
    """Generated from org.dds-wg.v1.group#StatementMember."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.group#statementMember", alias="$type")
    statement: _repo_strong_ref.Main

class UserMember(BaseModel):
    """Generated from org.dds-wg.v1.group#UserMember."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.group#userMember", alias="$type")
    did: str

class GroupMember(BaseModel):
    """Generated from org.dds-wg.v1.group#GroupMember."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.group#groupMember", alias="$type")
    group: _repo_strong_ref.Main
