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
- **Section 5:** Free-tier screens (Home, Live Scores, predictions, News)
- **Section 6:** Premium screens, lock screen, FCM
