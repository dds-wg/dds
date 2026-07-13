"""dds_client: Python client library for the DDS reference implementation.

Mirror of `@dds/client` (TypeScript). Use `DDSClient` for authenticated record CRUD
and `subscribe` for live + catch-up consumption.
"""

from .version import (
    COLLECTIONS,
    LEXICON_MAJOR,
    LEXICON_NS,
    LEXICON_VERSION,
    DDSCollection,
)
from .agent import DDSClient, parse_at_uri
from .auth import login_with_app_password
from .feed import DDSFeedEvent, subscribe
from .identity import clear_did_resolver_cache, resolve_did_pds
from .replay import (
    replay_from_cursor,
    replay_project_step,
    resolve_project_cursor,
    step_matches,
)

__all__ = [
    "COLLECTIONS",
    "DDSClient",
    "DDSCollection",
    "DDSFeedEvent",
    "LEXICON_MAJOR",
    "LEXICON_NS",
    "LEXICON_VERSION",
    "clear_did_resolver_cache",
    "login_with_app_password",
    "parse_at_uri",
    "replay_from_cursor",
    "replay_project_step",
    "resolve_did_pds",
    "resolve_project_cursor",
    "step_matches",
    "subscribe",
]
