# syntax=docker/dockerfile:1.7

# Production image template for a single SvelteKit app. Parameterized via build args so the
# same Dockerfile is reused for polis-interface, clustering-admin, visualisation.
#
# Build context = monorepo root (poc/dds-reference). Build args:
#   APP_NAME   - workspace package name, e.g. "@dds/polis-interface"
#   APP_DIR    - path within the monorepo, e.g. "apps/polis-interface"
#   BASE_PATH  - URL base path for SvelteKit (e.g. "/clustering"), empty for root mount

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build

ARG APP_NAME
ARG APP_DIR
ARG BASE_PATH=""

ENV NODE_ENV=production \
    BASE_PATH=${BASE_PATH} \
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
    && pnpm --filter "${APP_NAME}" build

# `pnpm deploy` produces /deploy with all workspace deps resolved into a self-contained tree
# (no symlinks pointing outside). It doesn't include build artifacts though, so we copy `build/`
# in afterwards.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter "${APP_NAME}" --prod --legacy deploy /deploy \
    && cp -r /workspace/${APP_DIR}/build /deploy/build


FROM node:${NODE_VERSION}-alpine AS runtime

RUN apk add --no-cache tini \
    && addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --from=build --chown=app:app /deploy ./

USER app
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "build"]
