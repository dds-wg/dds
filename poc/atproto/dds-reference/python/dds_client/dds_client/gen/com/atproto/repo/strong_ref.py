"""Stub for com.atproto.repo.strongRef.

The official lexicon ships with the atproto Python SDK, but our DDS-generated modules
import it as a local sibling. This file lets the generated tree be self-contained.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class Main(BaseModel):
    model_config = ConfigDict(extra="allow")
    uri: str
    cid: str


__all__ = ["Main"]
