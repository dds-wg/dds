"""Environment-driven configuration."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Server configuration. Values can be overridden via env vars prefixed `DDS_CS_`."""

    model_config = SettingsConfigDict(
        env_prefix="DDS_CS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(
        default="sqlite+aiosqlite:///./clustering.db",
        description="SQLAlchemy async URL. SQLite by default; swap to postgresql+asyncpg://... for Postgres.",
    )

    bsky_service: str = Field(default="https://bsky.social")
    jetstream_endpoint: str = Field(default="wss://jetstream1.us-east.bsky.network/subscribe")

    indexer_url: str = Field(
        default="http://indexer:8001",
        description="Base URL of the DDS indexer service. We poll it for new statements/votes for active analyses.",
    )
    indexer_poll_interval_seconds: float = Field(
        default=5.0,
        description="How often to poll the indexer for new records per active analysis.",
    )

    # Default rerun threshold (new votes + statements since last analysis) before reanalysis is queued.
    # Per-analysis values stored in the DB override this.
    default_rerun_threshold: int = Field(default=10)

    # The service identity used when republishing analysis results as DDS records.
    # Set via DDS_CS_SERVICE_HANDLE and DDS_CS_SERVICE_APP_PASSWORD env vars; without them, the
    # server runs in read-only mode (analyses are computed but not republished).
    service_handle: str | None = None
    service_app_password: str | None = None

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:5174"])
    log_level: str = "INFO"


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
