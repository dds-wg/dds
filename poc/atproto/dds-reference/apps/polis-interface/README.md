# `@dds/polis-interface`

The Polis-like SvelteKit app. Implements the [`POLIS_INTERFACE_SPEC.md`](../../../../reference_applicaitons_spec/POLIS_INTERFACE_SPEC.md):

- Bluesky OAuth sign-in
- Create a poll (an `org.dds-wg.v1.project` with an initial active phase)
- Share via URL: `/p/<repo>/<rkey>`
- Home page lists all projects in the user's repo
- Per-poll page: vote on statements one-at-a-time (random order, unseen first), add your own

It explicitly does NOT do analysis or visualisation — those live in the clustering server and
visualisation app respectively.

## Stack

- SvelteKit + Svelte 5 (runes)
- Tailwind v4 via `@dds/ui/theme.css`
- `@dds/client` for auth + record CRUD

## Run

```sh
pnpm install        # at the workspace root once
pnpm --filter @dds/polis-interface dev
```

The dev server listens on http://localhost:5173 by default. The OAuth flow uses Bluesky's loopback
redirect (`http://localhost?redirect_uri=...`) so no client-metadata.json is required for local dev.
Production deployment needs a hosted `client-metadata.json`; see `@dds/client`'s auth docs.
