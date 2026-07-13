# syntax=docker/dockerfile:1.7

# Production image for the @dds/indexer Node service.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build

ENV NODE_ENV=production \
    CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apk add --no-cache git python3 make g++ \
    && corepack enable

WORKDIR /workspace

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @dds/client codegen \
    && pnpm --filter @dds/client build \
    && pnpm --filter @dds/indexer build

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @dds/indexer --prod --legacy deploy /deploy \
    && cp -r /workspace/apps/indexer/dist /deploy/dist \
    && cp -r /workspace/apps/indexer/drizzle /deploy/drizzle


FROM node:${NODE_VERSION}-alpine AS runtime

RUN apk add --no-cache tini \
    && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production \
    INDEXER_HOST=0.0.0.0 \
    INDEXER_PORT=8001

WORKDIR /app

COPY --from=build --chown=app:app /deploy ./

USER app
EXPOSE 8001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
