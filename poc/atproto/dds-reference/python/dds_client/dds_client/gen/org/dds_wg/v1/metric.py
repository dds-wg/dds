"""GENERATED CODE — DO NOT EDIT.

Source: lexicons/org/dds-wg/v1/metric.json
Regenerate with `python scripts/codegen.py`.
"""
from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from dds_client.gen.com.atproto.repo import strong_ref as _repo_strong_ref
from dds_client.gen.org.dds_wg.v1 import defs as _v1_defs

__all__ = ["BooleanValue", "DecimalValue", "IntegerValue", "JsonValue", "Main", "Record", "StringValue"]

class Main(BaseModel):
    """Generated from org.dds-wg.v1.metric#Main."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric", alias="$type")
    schemaVersion: Optional[str] = None
    name: str
    creator: Union[_v1_defs.UserAgent, _v1_defs.AlgorithmAgent]
    metricType: str  # Free-form discriminator like 'groupInformedConsensus', 'agreeCount', etc.
    value: Optional[Union[IntegerValue, DecimalValue, StringValue, BooleanValue, JsonValue]] = None
    subject: _repo_strong_ref.Main
    step: Optional[_v1_defs.ProjectStepRef] = None
    createdAt: str

Record = Main

class IntegerValue(BaseModel):
    """An exact integer metric value."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric#integerValue", alias="$type")
    integer: int

class DecimalValue(BaseModel):
    """A decimal metric value. ATProto has no native float type, so this is encoded as a JSON-number string (e.g. '0.4231')."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric#decimalValue", alias="$type")
    decimal: str

class StringValue(BaseModel):
    """Generated from org.dds-wg.v1.metric#StringValue."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric#stringValue", alias="$type")
    string: str

class BooleanValue(BaseModel):
    """Generated from org.dds-wg.v1.metric#BooleanValue."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric#booleanValue", alias="$type")
    boolean: bool

class JsonValue(BaseModel):
    """Arbitrary JSON payload, serialized as a string."""
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field("org.dds-wg.v1.metric#jsonValue", alias="$type")
    json_: str = Field(..., alias="json")
