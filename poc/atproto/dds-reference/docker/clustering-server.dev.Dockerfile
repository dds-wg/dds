# syntax=docker/dockerfile:1.7

# Development image for the FastAPI clustering server. Auto-reloads on source changes.
# Build context = monorepo root (poc/dds-reference) so we can copy both dds_client and the server.

FROM python:3.13-slim AS dev

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Install dds_client + clustering_server in editable mode against mounted sources. The
# compose file mounts python/ over /workspace/python so source changes are picked up by
# uvicorn --reload without needing to rebuild the image.
COPY python/dds_client/pyproject.toml python/dds_client/README.md python/dds_client/
COPY python/dds_client/dds_client/__init__.py python/dds_client/dds_client/__init__.py
COPY python/clustering_server/pyproject.toml python/clustering_server/README.md python/clustering_server/
COPY python/clustering_server/clustering_server/__init__.py python/clustering_server/clustering_server/__init__.py

RUN pip install --no-cache-dir -e ./python/dds_client \
    && pip install --no-cache-dir -e ./python/clustering_server

# Compose mounts the real source over the top.
EXPOSE 8000

CMD ["uvicorn", "clustering_server.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/workspace/python"]
