# Predict Pro — one-click start (Windows / PowerShell)
# Builds and launches Postgres + Backend + Admin via Docker.
# Run:  powershell -ExecutionPolicy Bypass -File start.ps1   (or double-click start.bat)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Info($m) { Write-Host "==> $m" -ForegroundColor Green }
function Warn($m) { Write-Host "!! $m" -ForegroundColor Yellow }
function Err($m)  { Write-Host "xx $m" -ForegroundColor Red }

# 1. Docker present?
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Err "Docker is not installed."
  Write-Host "   Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
}

# 2. Docker running?
try { docker info | Out-Null } catch {
  Err "Docker is installed but not running. Start Docker Desktop and try again."
  exit 1
}

# 3. Resolve the Compose command (plugin `docker compose` or standalone `docker-compose`)
$script:DC = $null
try { docker compose version | Out-Null; $script:DC = 'plugin' } catch {}
if (-not $script:DC) {
  if (Get-Command docker-compose -ErrorAction SilentlyContinue) { $script:DC = 'standalone' }
}
if (-not $script:DC) {
  Err "Docker Compose is required (plugin 'docker compose' or 'docker-compose'). Update Docker Desktop."
  exit 1
}
function Compose { if ($script:DC -eq 'plugin') { docker compose @args } else { docker-compose @args } }

# 4. Ensure root .env exists
if (-not (Test-Path .env)) {
  Info "Creating .env from .env.example (edit it later to customize)"
  Copy-Item .env.example .env
}

# 5. Build + start
Info "Building and starting containers (first run downloads images; be patient)…"
Compose up -d --build

# Read a value from .env with a default
function Get-EnvValue($key, $default) {
  $line = Select-String -Path .env -Pattern "^$key=" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($line) { return ($line.Line -split '=', 2)[1] } else { return $default }
}

$backendPort = Get-EnvValue 'BACKEND_PORT' '3001'
$adminPort   = Get-EnvValue 'ADMIN_PORT' '3000'
$adminEmail  = Get-EnvValue 'ADMIN_EMAIL' 'admin@predictpro.local'
$adminPass   = Get-EnvValue 'ADMIN_PASSWORD' 'admin123'

# 6. Wait for backend health
Info "Waiting for the backend to become healthy…"
for ($i = 0; $i -lt 60; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing "http://localhost:$backendPort/health" -TimeoutSec 3
    if ($r.StatusCode -eq 200) { break }
  } catch { Start-Sleep -Seconds 2 }
  if ($i -eq 59) { Warn "Backend not healthy yet. Check logs with: docker compose logs -f backend" }
}

Write-Host ""
Info "Predict Pro is up!"
Write-Host "   Admin dashboard : http://localhost:$adminPort"
Write-Host "   Backend API     : http://localhost:$backendPort"
Write-Host "   Admin login     : $adminEmail / $adminPass"
Write-Host ""
Write-Host "   Logs : docker compose logs -f"
Write-Host "   Stop : powershell -ExecutionPolicy Bypass -File stop.ps1  (or stop.bat)"
