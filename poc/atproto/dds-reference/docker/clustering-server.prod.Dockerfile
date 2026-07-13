# syntax=docker/dockerfile:1.7

# Production image for the FastAPI clustering server. Multi-stage so the runtime layer
# doesn't carry build-essential. Build context = monorepo root (poc/dds-reference).

FROM python:3.13-slim AS build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy only what's needed for installing the two Python packages.
COPY python/dds_client python/dds_client
COPY python/clustering_server python/clustering_server
COPY lexicons lexicons

# Generate lexicon-derived pydantic models, then install both packages into a single venv.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

RUN pip install --no-cache-dir ./python/dds_client \
    && python ./python/dds_client/scripts/codegen.py \
    && pip install --no-cache-dir ./python/clustering_server


FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgomp1 \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app -m app

COPY --from=build /opt/venv /opt/venv

WORKDIR /app
USER app

EXPOSE 8000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "clustering_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
