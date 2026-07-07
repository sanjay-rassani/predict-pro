#!/usr/bin/env bash
# Predict Pro — stop all containers (Linux / macOS)
set -euo pipefail
cd "$(dirname "$0")"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "Docker Compose not found."; exit 1
fi

if [ "${1:-}" = "--clean" ]; then
  echo "==> Stopping and REMOVING data volume (database will be wiped)…"
  $DC down -v
else
  echo "==> Stopping containers (data is kept)…"
  $DC down
  echo "    (Use ./stop.sh --clean to also wipe the database.)"
fi
