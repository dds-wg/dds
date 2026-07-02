# `dds_client` (Python)

Python client library for the DDS reference implementation. Mirror of `@dds/client`.

## What it gives you

- **Generated Pydantic models** for every `org.dds-wg.v1.*` lexicon (via `scripts/codegen.py`)
- **`DDSClient`** that wraps an authenticated `atproto.Client` with typed
  `create_statement`/`create_ordinal_vote`/`create_project`/... methods, scoped to the session DID
- **`login_with_app_password`** convenience for Bluesky app-password auth (sufficient for
  server-side use like the clustering server)
- **`subscribe`** async generator that catches up via PDS `listRecords` then live-streams via
  the [Jetstream](https://github.com/bluesky-social/jetstream) WebSocket

## Quick start

```python
from datetime import datetime, timedelta
from dds_client import DDSClient, login_with_app_password, subscribe

client = login_with_app_password(identifier="alice.bsky.social", password="abcd-efgh-ijkl-mnop")
project = client.create_project(
    name="Climate Assembly",
    phases=[{"name": "Ideation", "order": 0, "status": "active"}],
)
print("created project:", project.uri)

cursor, statements = client.list_statements()
print("found", len(statements), "statements")

# Stream recent + live DDS records
async for ev in subscribe(catchup_since=datetime.utcnow() - timedelta(hours=1)):
    print(ev.source, ev.collection, ev.uri)
```

## Lexicon constants

```python
from dds_client import LEXICON_MAJOR, LEXICON_VERSION, COLLECTIONS
assert LEXICON_MAJOR == 1
assert LEXICON_VERSION == "1.0.0"
print(COLLECTIONS.statement)  # org.dds-wg.v1.statement
```

Every record authored through `DDSClient` carries the matching `schemaVersion` field.

## Setup (NixOS)

```sh
nix-shell -p "(python313.withPackages (ps: with ps; [ pip virtualenv ]))"
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python scripts/codegen.py
```

## Setup (other Linux / macOS)

```sh
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
python scripts/codegen.py
```
