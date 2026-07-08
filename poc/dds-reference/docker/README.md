# Docker

Self-contained dev and prod stacks for the four DDS reference services.

| File | Purpose |
| --- | --- |
| [`compose.dev.yml`](./compose.dev.yml) | Development: hot reload for all four services, opt-in Postgres |
| [`compose.prod.yml`](./compose.prod.yml) | Production: built images behind a Caddy reverse proxy |
| [`Caddyfile`](./Caddyfile) | Path-based routing for the prod stack |
| [`.env.example`](./.env.example) | Template for the `.env` file the prod compose reads |
| [`sveltekit.dev.Dockerfile`](./sveltekit.dev.Dockerfile) | Shared dev image for the three SvelteKit apps |
| [`sveltekit.prod.Dockerfile`](./sveltekit.prod.Dockerfile) | Production multi-stage image (build args: `APP_NAME`, `APP_DIR`, `BASE_PATH`) |
| [`clustering-server.dev.Dockerfile`](./clustering-server.dev.Dockerfile) | Dev image for the FastAPI clustering server (uvicorn `--reload`) |
| [`clustering-server.prod.Dockerfile`](./clustering-server.prod.Dockerfile) | Production multi-stage image for the clustering server |

## Development

```sh
# From the monorepo root (poc/dds-reference):
docker compose -f docker/compose.dev.yml up --build

# Or, with the postgres service running as well:
docker compose -f docker/compose.dev.yml --profile postgres up --build
```

Then:

| URL | Service |
| --- | --- |
| http://localhost:5173 | Polis interface |
| http://localhost:5174 | Clustering admin (its `/api/*` proxies to the FastAPI server) |
| http://localhost:5175 | Visualisation |
| http://localhost:8000 | Clustering REST API (`/api/health`) |
| postgres:5432 | Postgres (only if `--profile postgres`) |

The whole monorepo is mounted into each container, so edits to `packages/client-ts`,
`packages/ui`, or any app trigger Vite/uvicorn hot reload. The pnpm `node_modules` directories
are persisted as anonymous volumes so they don't get clobbered by the bind mount.

### Notes

- Sign-in uses the Bluesky OAuth loopback exemption (`http://localhost?redirect_uri=...`), so
  the dev stack works without a hosted client-metadata.json.
- The clustering server defaults to SQLite at `/var/lib/dds/clustering.db` (named volume). Set
  `DDS_CS_DATABASE_URL=postgresql+asyncpg://dds:dds@postgres:5432/dds` to use the Postgres
  profile instead.
- The clustering admin's `CLUSTERING_API_URL` env var points Vite's dev proxy at
  `http://clustering-server:8000` so `/api/*` requests reach the FastAPI container.

### Enabling cluster result publishing (dev)

By default the clustering server **computes** analyses but doesn't republish them as DDS records
(you can still see the raw output via `GET /api/analyses/{id}/runs`). To turn on publishing — so
the indexer picks up the groups and metrics, and they show up in the visualisation report — give
the clusterer a Bluesky service identity:

1. Pick (or create) a Bluesky account for the clusterer. E.g. `clustering.yourname.bsky.social`.
2. Generate an app password at <https://bsky.app/settings/app-passwords> (NOT your account password).
3. Copy `docker/.env.dev.example` to `docker/.env.dev` and fill in:
   ```
   DDS_CS_SERVICE_HANDLE=clustering.yourname.bsky.social
   DDS_CS_SERVICE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```
4. Start dev compose with the env file:
   ```sh
   docker compose -f docker/compose.dev.yml --env-file docker/.env.dev up --build
   ```
5. Trigger a run from the admin UI ("Run now"). Watch the clustering server logs:
   ```sh
   docker compose -f docker/compose.dev.yml logs -f clustering-server
   ```
   Successful publishes show as `INFO httpx: HTTP Request: POST .../com.atproto.repo.createRecord "200 OK"`.

Each successful run authors:

- One `org.dds-wg.v1.algorithm` record on first run (cached in `analysis.algorithm_uri` and
  reused thereafter).
- One `org.dds-wg.v1.group` per detected group, with `creator = algorithmAgent` referencing
  the algorithm record.
- Per-statement metrics: `groupInformedConsensus` (decimal), `agreeCount` / `disagreeCount` /
  `passCount` (integer), and `groupAgreeRates` (JSON blob).

All published records carry the `step` field (`{project, phase}`) so the indexer scopes them to
the right poll. Without `DDS_CS_SERVICE_HANDLE` set the clustering server stays read-only —
analyses are computed and visible via the REST API, just not republished as DDS records.

## Production

```sh
cp docker/.env.example docker/.env
$EDITOR docker/.env       # set PUBLIC_HOST, POSTGRES_PASSWORD, etc.

# From the monorepo root:
docker compose -f docker/compose.prod.yml --env-file docker/.env up -d --build
```

By default Caddy listens on port `8080` (HTTP) and routes:

| Path | Service |
| --- | --- |
| `/` | Polis interface (SvelteKit, `BASE_PATH=""`) |
| `/clustering/*` | Clustering admin (SvelteKit, `BASE_PATH=/clustering`) |
| `/vis/*` | Visualisation (SvelteKit, `BASE_PATH=/vis`) |
| `/api/*` | Clustering REST API (FastAPI) |

### TLS

Set `PUBLIC_HOST=dds.example.com` (a public hostname pointed at the host) in `.env`, and Caddy
will automatically provision a Let's Encrypt certificate. Make sure ports 80 and 443 reach the
host (the `HOST_HTTP_PORT` / `HOST_HTTPS_PORT` vars in `.env`).

### Production OAuth

The Bluesky OAuth loopback exemption only applies to localhost. In production, every SvelteKit
app needs a hosted `client-metadata.json` at a public URL. The current `createBrowserAuth`
helper takes a `clientId` config; update the per-app `auth.svelte.ts` to read it from
`PUBLIC_OAUTH_CLIENT_ID` (a future task) and host the metadata behind Caddy.

### Service identity

For the clustering server to republish DDS records as `org.dds-wg.v1.group` and
`org.dds-wg.v1.metric` records, give it a Bluesky service identity:

```
DDS_CS_SERVICE_HANDLE=clustering.your-domain
DDS_CS_SERVICE_APP_PASSWORD=...generated app password...
```

Without these the server still runs analyses, it just doesn't republish them.

## One-off commands

```sh
# Tail clustering-server logs
docker compose -f docker/compose.dev.yml logs -f clustering-server

# Rebuild a single service
docker compose -f docker/compose.prod.yml build polis-interface

# Run codegen inside the dev image (e.g. after editing lexicons)
docker compose -f docker/compose.dev.yml run --rm polis-interface pnpm --filter @dds/client codegen

# Shell into a container
docker compose -f docker/compose.dev.yml exec clustering-server bash
```
