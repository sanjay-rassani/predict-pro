# Predict Pro — stop all containers (Windows / PowerShell)
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$dc = $null
try { docker compose version | Out-Null; $dc = 'plugin' } catch {}
if (-not $dc) { if (Get-Command docker-compose -ErrorAction SilentlyContinue) { $dc = 'standalone' } }
if (-not $dc) { Write-Host "Docker Compose not found." -ForegroundColor Red; exit 1 }
function Compose { if ($dc -eq 'plugin') { docker compose @args } else { docker-compose @args } }

if ($args -contains '--clean') {
  Write-Host "==> Stopping and REMOVING data volume (database will be wiped)…" -ForegroundColor Yellow
  Compose down -v
} else {
  Write-Host "==> Stopping containers (data is kept)…" -ForegroundColor Green
  Compose down
  Write-Host "    (Use: powershell -File stop.ps1 --clean  to also wipe the database.)"
}
