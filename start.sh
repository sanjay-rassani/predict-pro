#!/usr/bin/env bash
# Predict Pro — one-click start (Linux / macOS)
# Builds and launches Postgres + Backend + Admin via Docker.
set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { printf "${GREEN}==>${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}!!${NC} %s\n" "$1"; }
err()  { printf "${RED}xx${NC} %s\n" "$1"; }

# 1. Docker present?
if ! command -v docker >/dev/null 2>&1; then
  err "Docker is not installed."
  echo "   Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# 2. Docker running?
if ! docker info >/dev/null 2>&1; then
  err "Docker is installed but not running. Start Docker Desktop and try again."
  exit 1
fi

# 3. Resolve the Compose command (plugin `docker compose` or standalone `docker-compose`)
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  err "Docker Compose is required (plugin 'docker compose' or 'docker-compose')."
  echo "   Update Docker Desktop, or install the compose plugin."
  exit 1
fi

# 4. Ensure root .env exists
if [ ! -f .env ]; then
  info "Creating .env from .env.example (edit it later to customize)"
  cp .env.example .env
fi

# 5. Build + start
info "Building and starting containers (first run downloads images; be patient)…"
$DC up -d --build

# 6. Wait for backend health
info "Waiting for the backend to become healthy…"
BACKEND_PORT="$(grep -E '^BACKEND_PORT=' .env | cut -d= -f2 || true)"
BACKEND_PORT="${BACKEND_PORT:-3001}"
ADMIN_PORT="$(grep -E '^ADMIN_PORT=' .env | cut -d= -f2 || true)"
ADMIN_PORT="${ADMIN_PORT:-3000}"

for i in $(seq 1 60); do
  if curl -fs "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    warn "Backend did not report healthy in time. Check logs: $DC logs -f backend"
  fi
done

ADMIN_EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2 || echo admin@predictpro.local)"
ADMIN_PASSWORD="$(grep -E '^ADMIN_PASSWORD=' .env | cut -d= -f2 || echo admin123)"

echo
info "Predict Pro is up!"
echo "   Admin dashboard : http://localhost:${ADMIN_PORT}"
echo "   Backend API     : http://localhost:${BACKEND_PORT}"
echo "   Admin login     : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
echo
echo "   Logs : $DC logs -f"
echo "   Stop : ./stop.sh"
