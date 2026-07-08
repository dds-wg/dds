# `clustering_server`

The DDS clustering service. Implements the
[`CLUSTERING_ALGORITHUM.MD`](../../../reference_applicaitons_spec/CLUSTERING_ALGORITHUM.MD) spec:

1. Logged-in Bluesky users request analysis of a DDS project step
2. The server catches up on that step via the feed + PDS, then persists votes and statements
3. A pluggable analysis engine (red-dwarf if available, scikit-learn KMeans fallback) computes
   group structure + per-statement metrics
4. Results are republished as `org.dds-wg.v1.group` and `org.dds-wg.v1.metric` records via a
   service identity, with the algorithm record acting as the `creator`
5. Analysis re-runs after a configurable number of new statements + votes

## API surface

```
GET    /api/analyses                       List all analyses
POST   /api/analyses                       Create a new analysis
GET    /api/analyses/{id}                  Get analysis status
PATCH  /api/analyses/{id}                  Pause/resume/end OR change rerun threshold
POST   /api/analyses/{id}/run              Trigger an immediate run
GET    /api/analyses/{id}/runs             List recent runs
GET    /api/health                         Liveness probe
```

The admin SvelteKit UI at [`apps/clustering-admin`](../../apps/clustering-admin) consumes these.

## Configuration

All settings come from env vars prefixed `DDS_CS_` (or a `.env` file in cwd):

| Var | Default | Purpose |
| --- | --- | --- |
| `DDS_CS_DATABASE_URL` | `sqlite+aiosqlite:///./clustering.db` | SQLAlchemy async URL. Swap to `postgresql+asyncpg://...` for Postgres (requires the `postgres` extra) |
| `DDS_CS_BSKY_SERVICE` | `https://bsky.social` | The PDS the service identity authenticates against |
| `DDS_CS_JETSTREAM_ENDPOINT` | `wss://jetstream1.us-east.bsky.network/subscribe` | Jetstream WebSocket URL |
| `DDS_CS_DEFAULT_RERUN_THRESHOLD` | `10` | Default rerun threshold for new analyses |
| `DDS_CS_SERVICE_HANDLE` | _unset_ | Service-identity handle. Without it the server runs read-only |
| `DDS_CS_SERVICE_APP_PASSWORD` | _unset_ | Service-identity Bluesky app password |
| `DDS_CS_CORS_ORIGINS` | `["http://localhost:5173","http://localhost:5174"]` | CORS origins for the admin UI |

## Engine

The analysis engine is resolved at run time by `red_dwarf_adapter.get_engine()`:

- If `red-dwarf` is installed (`pip install "git+https://github.com/polis-community/red-dwarf.git"`)
  the adapter (still TODO) will call into it
- Otherwise the **fallback**, a scikit-learn KMeans-based clustering, runs. It produces a vaguely
  Polis-shaped output (k groups + group-informed-consensus per statement) but it's a stub, not a
  substitute for the real Polis math

## Run

### NixOS (recommended)

Numpy / scikit-learn / greenlet ship C extensions that won't import out of the box under pip on
NixOS. Use Nix's pre-built packages by entering a shell that exposes them and creating the venv
with `--system-site-packages`:

```sh
cd python/clustering_server
nix-shell -p '(python313.withPackages (ps: with ps; [ pip virtualenv numpy scikit-learn pydantic greenlet aiosqlite ]))'
python -m venv --system-site-packages .venv
source .venv/bin/activate
pip install -e '../dds_client'
pip install -e '.'
# pip may have installed its own greenlet/aiosqlite into the venv, masking nix's.
# Delete those so the C-extension imports from nix work:
rm -rf .venv/lib/python3.13/site-packages/{greenlet*,aiosqlite*}
clustering-server
```

### Linux / macOS (non-Nix)

```sh
uv venv .venv && source .venv/bin/activate
uv pip install -e '../dds_client'
uv pip install -e '.[dev]'
clustering-server
```

The server listens on `http://localhost:8000`.
