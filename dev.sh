#!/usr/bin/env bash
# Lance une commande dans le conteneur Node de dev (ex. ./dev.sh npm test)
set -euo pipefail
cd "$(dirname "$0")"
exec docker compose run --rm --no-deps -T app "$@"
