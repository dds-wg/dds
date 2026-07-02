# DDS Reference Implementation: Python

Two Python packages, sister to the TypeScript monorepo:

| Path | What it is |
| --- | --- |
| [`dds_client/`](./dds_client) | The Python equivalent of `@dds/client`: Pydantic types generated from the v1 lexicons, Bluesky auth, typed convenience methods, feed consumer |
| [`clustering_server/`](./clustering_server) | The clustering FastAPI service that runs red-dwarf and republishes results as DDS groups + metrics |

## NixOS / nix-shell

NixOS users can drop into a working Python env from `python/`:

```sh
nix-shell -p "(python313.withPackages (ps: with ps; [ pip virtualenv ]))" uv
```

Then use the package-local `uv` workflow:

```sh
cd dds_client
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
python scripts/codegen.py    # regenerate lexicon models
pytest                       # tests (when present)
```

The `clustering_server/` package follows the same workflow.
