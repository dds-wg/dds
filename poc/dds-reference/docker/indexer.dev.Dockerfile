# syntax=docker/dockerfile:1.7

# Dev image for the @dds/indexer Node service. Mounts source via the compose bind mount;
# tsx watch handles rebuilds on change.

FROM node:22-alpine

ENV CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git python3 make g++ \
    && corepack enable

WORKDIR /workspace

COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./
COPY packages/client-ts/package.json packages/client-ts/
COPY packages/ui/package.json packages/ui/
COPY apps/polis-interface/package.json apps/polis-interface/
COPY apps/clustering-admin/package.json apps/clustering-admin/
COPY apps/visualisation/package.json apps/visualisation/
COPY apps/indexer/package.json apps/indexer/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

EXPOSE 8001
