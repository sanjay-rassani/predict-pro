# Predict Pro — Mobile App

Flutter app (iOS & Android) for end users. Dark theme with purple accent (`#6A0DAD`).

## Prerequisites

- Flutter 3.x stable (`flutter doctor`)
- Android Studio + emulator, or Xcode + simulator (iOS), or a physical device

Install Flutter if needed:

```bash
# Example: clone stable SDK to ~/flutter and add to PATH
export PATH="$HOME/flutter/bin:$PATH"
flutter doctor
```

## Environment / config

Copy `.env.example` values into your run configuration or use `--dart-define` (wired in Section 5):

| Variable | Required | Description |
|---|---|---|
| `API_BASE_URL` | Section 5+ | Backend REST URL |
| `WS_BASE_URL` | Section 5+ | WebSocket URL |

Firebase config files (`google-services.json`, `GoogleService-Info.plist`) are added locally in Section 4 — never commit them.

## Scripts

```bash
flutter pub get
flutter analyze
flutter build web --release   # compile verify (no emulator needed)
flutter run                   # emulator or connected device
flutter build apk             # Android release build
```

## Section status

- **Section 0:** Flutter project scaffold
- **Section 5:** Free-tier screens — dark theme, REST + WebSocket, demo login, Home, Live Scores, 1X2, Under/Over, News, My Predictions
- **Section 6:** Premium screens — Smart Signals hub (Surprise, Game Back, Analytics), lock screen for free users, live odds via WebSocket, push registration + in-app alerts
- **Section 7:** Polish — loading/empty/error states, API error handling, WebSocket reconnect, smoke tests

## Run against local backend

```bash
# Terminal 1 — backend on :3001
cd backend && npm run dev

# Terminal 2 — mobile (Android emulator uses 10.0.2.2 for host localhost)
export PATH="$HOME/flutter/bin:$PATH"
cd mobile && flutter pub get && flutter run
```

Demo accounts (seeded in backend): `free@predictpro.local`, `premium@predictpro.local`

Override API host for desktop/web:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3001 --dart-define=WS_BASE_URL=http://localhost:3001
```
