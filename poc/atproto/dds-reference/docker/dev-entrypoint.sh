#!/bin/sh
# Dev container entrypoint for SvelteKit apps.
#
# By the time we run, the `client-builder` service has done lexicon codegen + the initial
# @dds/client build (it stays running in tsup --watch mode to rebuild on changes), so we
# can go straight to the per-app dev command.

set -e
exec "$@"
