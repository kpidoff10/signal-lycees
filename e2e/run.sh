#!/usr/bin/env bash
# Lance les tests E2E dans l'image Playwright officielle contre le serveur de dev (port 3100).
set -euo pipefail
cd "$(dirname "$0")/.."
docker run --rm --network host -v "$PWD":/app -w /app -e BASE_URL="${BASE_URL:-http://127.0.0.1:3100}" -e PREVIEW_USER -e PREVIEW_PASSWORD \
  mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test "$@"
