#!/usr/bin/env bash
# Predict Pro — mobile app runner/builder (Linux / macOS)
#
# Usage:
#   ./run.sh                 # interactive: pick a target
#   ./run.sh chrome          # run in Chrome (web)
#   ./run.sh android         # run on Android emulator/device
#   ./run.sh apk             # build a release APK (share this file with clients)
#   ./run.sh <target> <API_HOST>   # override backend host, e.g. 192.168.1.20
#
# The backend must already be running (./start.sh in the project root).
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { printf "${GREEN}==>${NC} %s\n" "$1"; }
err()  { printf "${RED}xx${NC} %s\n" "$1"; }

# Ensure Flutter is on PATH (fallback to ~/flutter/bin)
if ! command -v flutter >/dev/null 2>&1; then
  if [ -x "$HOME/flutter/bin/flutter" ]; then
    export PATH="$HOME/flutter/bin:$PATH"
  else
    err "Flutter SDK not found."
    echo "   Install: https://docs.flutter.dev/get-started/install"
    echo "   Or add it to PATH:  export PATH=\"\$HOME/flutter/bin:\$PATH\""
    exit 1
  fi
fi

TARGET="${1:-}"
API_HOST="${2:-}"

if [ -z "$TARGET" ]; then
  echo "Choose a target:"
  echo "  1) chrome   (web browser)"
  echo "  2) android  (emulator or device)"
  echo "  3) apk      (build release APK to share)"
  read -r -p "Enter 1/2/3: " choice
  case "$choice" in
    1) TARGET="chrome" ;;
    2) TARGET="android" ;;
    3) TARGET="apk" ;;
    *) err "Invalid choice"; exit 1 ;;
  esac
fi

# Pick a sensible default backend host per target:
#  - chrome/desktop: localhost   - android emulator: 10.0.2.2 (host loopback)
if [ -z "$API_HOST" ]; then
  if [ "$TARGET" = "android" ]; then API_HOST="10.0.2.2"; else API_HOST="localhost"; fi
fi

API_BASE="http://${API_HOST}:3001"
DEFINES="--dart-define=API_BASE_URL=${API_BASE} --dart-define=WS_BASE_URL=${API_BASE}"

info "Fetching Dart packages…"
flutter pub get

info "Backend URL: ${API_BASE}"
case "$TARGET" in
  chrome)
    info "Launching in Chrome…"
    flutter run -d chrome $DEFINES
    ;;
  android)
    info "Launching on Android…"
    flutter run -d android $DEFINES
    ;;
  apk)
    info "Building release APK…"
    flutter build apk --release $DEFINES
    echo
    info "APK ready: build/app/outputs/flutter-apk/app-release.apk"
    echo "   Send this file to clients; they enable 'Install unknown apps' to install it."
    ;;
  *)
    err "Unknown target: $TARGET"; exit 1 ;;
esac
