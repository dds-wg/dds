# `@dds/clustering-admin`

Tiny SvelteKit admin UI for the clustering server. Lists active analyses, pauses/resumes/ends
them, and adjusts the per-analysis rerun threshold.

## Stack

- SvelteKit + Svelte 5 (runes)
- Tailwind v4 via `@dds/ui/theme.css`
- Talks to the FastAPI server at `http://localhost:8000` via a Vite dev proxy

## Run

```sh
# in one terminal: start the clustering server (see ../../python/clustering_server/README.md)
# in another:
pnpm --filter @dds/clustering-admin dev
```

The admin UI listens on http://localhost:5174 (port chosen so it doesn't collide with the
polis-interface on 5173).
