# Predict Pro — mobile app runner/builder (Windows / PowerShell)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File run.ps1              # interactive
#   powershell -ExecutionPolicy Bypass -File run.ps1 chrome
#   powershell -ExecutionPolicy Bypass -File run.ps1 android
#   powershell -ExecutionPolicy Bypass -File run.ps1 apk
#   powershell -ExecutionPolicy Bypass -File run.ps1 android 192.168.1.20
#
# The backend must already be running (start.ps1 in the project root).

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Info($m) { Write-Host "==> $m" -ForegroundColor Green }
function Err($m)  { Write-Host "xx $m" -ForegroundColor Red }

# Ensure Flutter is available (fallback to %USERPROFILE%\flutter\bin)
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  $fallback = Join-Path $env:USERPROFILE 'flutter\bin'
  if (Test-Path (Join-Path $fallback 'flutter.bat')) {
    $env:PATH = "$fallback;$env:PATH"
  } else {
    Err "Flutter SDK not found."
    Write-Host "   Install: https://docs.flutter.dev/get-started/install/windows"
    exit 1
  }
}

$target = if ($args.Count -ge 1) { $args[0] } else { '' }
$apiHost = if ($args.Count -ge 2) { $args[1] } else { '' }

if (-not $target) {
  Write-Host "Choose a target:"
  Write-Host "  1) chrome   (web browser)"
  Write-Host "  2) android  (emulator or device)"
  Write-Host "  3) apk      (build release APK to share)"
  $choice = Read-Host "Enter 1/2/3"
  switch ($choice) {
    '1' { $target = 'chrome' }
    '2' { $target = 'android' }
    '3' { $target = 'apk' }
    default { Err "Invalid choice"; exit 1 }
  }
}

if (-not $apiHost) {
  if ($target -eq 'android') { $apiHost = '10.0.2.2' } else { $apiHost = 'localhost' }
}

$apiBase = "http://${apiHost}:3001"
$defines = "--dart-define=API_BASE_URL=$apiBase", "--dart-define=WS_BASE_URL=$apiBase"

Info "Fetching Dart packages…"
flutter pub get

Info "Backend URL: $apiBase"
switch ($target) {
  'chrome'  { Info "Launching in Chrome…";  flutter run -d chrome @defines }
  'android' { Info "Launching on Android…"; flutter run -d android @defines }
  'apk'     {
    Info "Building release APK…"
    flutter build apk --release @defines
    Write-Host ""
    Info "APK ready: build\app\outputs\flutter-apk\app-release.apk"
    Write-Host "   Send this file to clients to install on Android."
  }
  default { Err "Unknown target: $target"; exit 1 }
}
