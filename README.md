# Predict Pro

Real-time football signal and prediction platform. A Flutter mobile app for end users, a separate Next.js admin dashboard, and a shared Node.js backend — all talking to one API.

## Monorepo layout

```
predict-pro/
├── backend/   # Node.js + Express + PostgreSQL + Socket.IO
├── admin/     # Next.js + Tailwind admin dashboard
└── mobile/    # Flutter app (iOS & Android)
```

## Prerequisites

| Tool | Version | Used by |
|---|---|---|
| Node.js | 20+ | backend, admin |
| PostgreSQL | 16+ | backend |
| Flutter | 3.x stable | mobile |

> **Flutter SDK:** installed at `~/flutter`. Add to your shell: `export PATH="$HOME/flutter/bin:$PATH"`

External services (see app READMEs for when each is needed):

- **API-Football** — match data, live scores, odds
- **Firebase (FCM)** — push notifications to premium users

## Quick start

### Backend

```bash
cd backend
cp .env.example .env   # edit values before Section 1
npm install
npm run dev            # http://localhost:3001 (full API in Section 1)
```

### Admin dashboard

```bash
cd admin
cp .env.example .env
npm install
npm run dev            # http://localhost:3000
```

### Mobile app

```bash
cd mobile
flutter pub get
flutter run            # requires emulator or device
```

## Build order

Follow `TODO.md` section by section. Do not skip ahead — each section must be complete and verified before the next.

## Docs

- `predict-pro-cursor-spec.md` — Phase 1 product spec
- `TODO.md` — section-by-section build checklist
