# DDS Reference Implementation

A reference implementation of [DDS](../..) built on top of the ATProto network
(Bluesky-only auth for now). Comprised of three apps and two client libraries that all communicate
through the canonical `org.dds-wg.*` lexicon.

## Apps

| Path | What it does |
| --- | --- |
| [`apps/polis-interface`](./apps/polis-interface) | Polis-like SvelteKit app for creating polls, statements, votes |
| [`python/clustering_server`](./python/clustering_server) | FastAPI server that runs [red-dwarf](https://github.com/polis-community/red-dwarf) over a project step |
| [`apps/clustering-admin`](./apps/clustering-admin) | Lightweight SvelteKit admin UI for the clustering server |
| [`apps/visualisation`](./apps/visualisation) | SvelteKit + Layer Cake report viewer for a project step |

## Libraries

| Path | Language | What it does |
| --- | --- | --- |
| [`packages/client-ts`](./packages/client-ts) | TypeScript | Lexicon types, Bluesky auth, query/mutate helpers, feed consumer |
| [`python/dds_client`](./python/dds_client) | Python | Pydantic models, Bluesky auth, query/mutate helpers, feed consumer |
| [`packages/ui`](./packages/ui) | TypeScript / Svelte | Shared Tailwind preset and components |

## Lexicons

The canonical, formal ATProto lexicon files live in [`lexicons/org.dds-wg/`](./lexicons/org.dds-wg).
Run `pnpm codegen` from this directory to regenerate types in both languages.

## Getting started

### Docker (recommended)

```sh
# Dev: hot reload for all four services
docker compose -f docker/compose.dev.yml up --build

# Prod: Caddy fronts everything on :8080
cp docker/.env.example docker/.env && $EDITOR docker/.env
docker compose -f docker/compose.prod.yml --env-file docker/.env up -d --build
```

See [`docker/README.md`](./docker/README.md) for the full runbook.

### Native

```sh
pnpm install
pnpm codegen:ts
pnpm dev:polis        # or dev:vis, dev:clustering-admin
```

For Python, see [`python/README.md`](./python/README.md).

## Progress

See [`progress/`](./progress) for incremental notes. `progress/00-plan.md` is the canonical plan.
