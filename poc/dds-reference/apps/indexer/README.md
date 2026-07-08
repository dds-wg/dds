# `@dds/indexer`

TypeScript/Node service that subscribes to the Bluesky jetstream, indexes every
`org.dds-wg.v1.*` record into a local DB, and exposes project-scoped REST endpoints for
the frontends to consume.

## Why this exists

In a federated network, statements/votes/groups/metrics live in their authors' PDSes. Asking
"give me every statement that targets project X" can't be answered with a single
`com.atproto.repo.listRecords` call because the data is spread across many repos. The
indexer is the appview for the DDS lexicon: one jetstream connection, one DB, many readers.

## API

```
GET  /api/health
GET  /api/statements?project=&phase=&author=&limit=&cursor=
GET  /api/votes?project=&phase=&target=&voter=&limit=&cursor=
GET  /api/groups?project=&phase=&creator=&limit=&cursor=
GET  /api/metrics?project=&phase=&subject=&limit=&cursor=
GET  /api/responses?target=&author=&limit=&cursor=
GET  /api/proposals?project=&phase=&creator=&limit=&cursor=
GET  /api/decisions?project=&phase=&creator=&limit=&cursor=
GET  /api/summaries?subject=&creator=&limit=&cursor=
GET  /api/classifications?subject=&creator=&label=&limit=&cursor=
GET  /api/algorithms?creator=&limit=&cursor=
GET  /api/projects?repo=&limit=&cursor=
GET  /api/records?uri=
POST /api/projects/backfill        body: { projectUri }
GET  /api/projects/backfill?project=
```

All list responses are `{ items: Record[], cursor: string | null }`. Pass the `cursor` back
in the next request to paginate.

## Config

All env vars are optional and have sensible defaults.

| Var | Default | Purpose |
| --- | --- | --- |
| `INDEXER_PORT` | `8001` | HTTP port |
| `INDEXER_HOST` | `0.0.0.0` | Bind host |
| `INDEXER_DATABASE_URL` | `file:./indexer.db` | SQLite path or `postgres://...` URL (Postgres support pending) |
| `INDEXER_JETSTREAM_ENDPOINT` | `wss://jetstream1.us-east.bsky.network/subscribe` | Jetstream WebSocket |
| `INDEXER_PDS_FALLBACK` | `https://bsky.social` | PDS to read project records from during backfill (DID resolution overrides when possible) |
| `INDEXER_CORS_ORIGINS` | localhost / 127.0.0.1 :5173-5175 | JSON array |
| `INDEXER_LOG_LEVEL` | `info` | pino level |

## Run

```sh
# from monorepo root
pnpm --filter @dds/indexer db:generate     # produce migration SQL from schema
pnpm --filter @dds/indexer dev             # tsx watch, port 8001
```

In Docker dev:

```sh
docker compose -f docker/compose.dev.yml up indexer
```

## Schema

One generic `records` table with extracted index columns:

| column | type | notes |
| --- | --- | --- |
| `uri` | text PK | `at://did/collection/rkey` |
| `cid` | text | record CID |
| `did` | text | author's DID |
| `collection` | text | NSID |
| `rkey` | text | record key |
| `record_created_at_ms` | int | from `value.createdAt` |
| `indexed_at_ms` | int | when we wrote it |
| `project_uri` | text? | from `value.step.project.uri` |
| `phase` | text? | from `value.step.phase` |
| `target_uri` | text? | from `value.target.uri` |
| `subject_uri` | text? | from `value.subject.uri` |
| `value` | json | full record value |

Indexes on the typical query paths: `(project_uri, phase, collection)`, `(target_uri)`,
`(subject_uri)`, `(did, collection)`, `(record_created_at_ms)`.
