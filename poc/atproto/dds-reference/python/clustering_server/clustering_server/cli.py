"""Entry point: `clustering-server` runs uvicorn with the FastAPI app."""

from __future__ import annotations


def main() -> None:
    import uvicorn

    uvicorn.run(
        "clustering_server.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()
