# syntax=docker/dockerfile:1.7

# Development image used by all three SvelteKit apps. Hot reload via Vite.
# Mount the monorepo at /workspace and use named volumes for node_modules to keep installs fast.

FROM node:22-alpine

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git python3 make g++ \
    && corepack enable

WORKDIR /workspace

# Copy lockfile + workspace manifest first so `pnpm install` caches well when only
# source code changes during development.
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./
COPY packages/client-ts/package.json packages/client-ts/
COPY packages/ui/package.json packages/ui/
COPY apps/polis-interface/package.json apps/polis-interface/
COPY apps/clustering-admin/package.json apps/clustering-admin/
COPY apps/visualisation/package.json apps/visualisation/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Dev entrypoint: ensures @dds/client is built (its `exports` point at dist/) before running
# the per-app dev command. Compose mounts the rest of the monorepo over /workspace.
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint
RUN chmod +x /usr/local/bin/dev-entrypoint

EXPOSE 5173 5174 5175
ENTRYPOINT ["/usr/local/bin/dev-entrypoint"]
# The compose file picks which app to run via `command:`.
