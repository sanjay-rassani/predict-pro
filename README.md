<!-- markdownlint-disable MD013 -->
# Predict Pro

> Real-time football **predictions & smart signals** platform.

Predict Pro is a football prediction and live-signals product with a decoupled
architecture: a **Flutter** mobile app for end users, a separate **Next.js**
admin dashboard, and a shared **Node.js** backend — all talking to one API.
Admins publish predictions (1X2, Under/Over) and news, and review automated
"smart signals" (Surprise, Comeback) before they go live. **Free** users get the
basics; **Premium** users additionally get live automated signals, real-time
odds, and analytics.

- No payments in this phase — role (`free` / `premium`) is just a database field.
- Works **fully offline of external services** out of the box via demo/mock modes.

---

## Table of contents

1. [Application overview](#application-overview)
2. [Architecture](#architecture)
3. [Quick start (one click)](#quick-start-one-click)
4. [Prerequisites](#prerequisites)
5. [Manual setup (development)](#manual-setup-development)
6. [Mobile app](#mobile-app)
7. [Default accounts](#default-accounts)
8. [Configuration](#configuration)
9. [Feature access matrix](#feature-access-matrix)
10. [Project structure](#project-structure)
11. [Common commands](#common-commands)
12. [Tests](#tests)
13. [Troubleshooting](#troubleshooting)
14. [Production notes](#production-notes)
15. [Out of scope](#out-of-scope-phase-1)
16. [Documentation](#documentation)

---

## Application overview

### What it is

Predict Pro helps football fans make smarter bets and follow matches in real
time. A single **admin** curates the content — publishing predictions and news,
and approving automated "smart signals" — while end users consume it through a
mobile app. Users come in two tiers:

- **Free** — live scores, standings, manual predictions (1X2 & Under/Over),
  news, and their own prediction history.
- **Premium** — everything Free has, **plus** automated smart signals, live
  (WebSocket) odds, analytics, and push notifications.

There is **no payment flow** in this phase — a user's tier is simply a `role`
field (`free` / `premium`) set directly in the database.

### How it works (end to end)

```
API-Football / demo feed
        │  (matches, live scores, odds)
        ▼
   Backend  ──▶ Scanner detects "Surprise" & "Comeback" patterns
        │            │
        │            ▼
        │      Admin Approval Queue  ──(approve)──▶ visible in app + FCM push
        │            │
        │      Admin also manually publishes 1X2 / Under-Over predictions & news
        ▼
   REST + WebSocket
        │
        ▼
   Mobile app  ──▶ Free screens (always) + Premium screens (role-gated)
```

1. Match, score, and odds data flows in from **API-Football** (or the built-in
   **demo feed** when no key is configured).
2. A background **scanner** watches live data and flags two kinds of automated
   signals (see below). Flagged signals **never auto-publish** — they land in the
   admin's **Approval Queue** first.
3. The **admin** approves/rejects signals and manually publishes standard
   predictions and news.
4. Approved content is served to the **mobile app** over REST, with live scores
   and premium odds streamed over **WebSocket**. Approving a signal fires a
   **push notification** to premium users.

### The two automated "smart signals"

| Signal | Trigger (from live data) | Meaning for the user |
|--------|--------------------------|----------------------|
| **Surprise** | A team's live win odds spike above a threshold (e.g. `> 4.00`) | An underdog upset may be brewing |
| **Comeback ("Game Back")** | A team is losing by exactly one goal at halftime | A likely second-half comeback opportunity |

Both are saved as `pending` and only reach premium users after admin approval.

### User roles

| Role | Count | Can do |
|------|-------|--------|
| **Admin** | Exactly one | Publish/edit/delete matches, predictions & news; approve or reject automated signals; view API/notification settings |
| **Free user** | Many | View live scores & standings, manual predictions, news, own prediction history |
| **Premium user** | Many | Everything Free, plus automated signals, real-time odds, analytics & push |

**Paywall rule:** when a free user opens a premium screen, they see a friendly
lock placeholder ("Upgrade to Premium to unlock real-time smart signals") — there
is no purchase behind it, just a locked state.

### Mobile app — screens

| # | Screen | Tier | What it shows |
|---|--------|------|---------------|
| 1 | **Home** | Free | Featured matches, upcoming fixtures, category tabs |
| 2 | **Live Scores** | Free | Real-time score, minute, halftime score, status, team logos, **league standings** (via WebSocket) |
| 3 | **1X2 Predictions** | Free | Published matches with 1 / X / 2 selections and odds |
| 4 | **Under / Over** | Free | Over 2.5 / Under 2.5 predictions with odds |
| 5 | **News** | Free | Admin-published articles (injuries, transfers, lineups, general) |
| 6 | **My Predictions** | Free | Personal history with GREEN = win / RED = loss badges (no profit/loss math) |
| 7 | **Odds Surprises** | Premium | Live feed of approved Surprise signals with real-time odds |
| 8 | **Game Back** | Premium | Live feed of approved Comeback signals with real-time odds |
| 9 | **Signal History & Analytics** | Premium | Totals, wins, losses, success-rate %, grouped by Surprise vs Comeback |
| 10 | **Premium Lock** | Free | Shown in place of screens 7–9 for free users |

Design: dark theme with a purple accent (`#6A0DAD`).

### Admin dashboard — screens

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **Login** | Single admin account, email/password, JWT session |
| 2 | **Matches** | Upcoming/active matches; filter by date, league, market |
| 3 | **Manual Entry** | Modal to publish a prediction: type, odds, confidence, notes |
| 4 | **Approval Queue** | Pending automated signals with Approve / Reject |
| 5 | **News Management** | Create / edit / delete / publish articles |
| 6 | **Settings / API Health** | API quota & endpoint status, toggle push dispatch on/off |

### Real-time & notifications

- **Live scores, standings, and premium odds** are pushed over **Socket.IO**.
  Free users see a static odds snapshot from publish time; premium users see odds
  that update live.
- **Push notifications (FCM)** fire to premium users when the admin approves a
  signal. Without Firebase credentials this runs in **mock mode** (logged only).

### Data model (high level)

| Entity | Key fields |
|--------|-----------|
| **Admin user** | email, hashed password (one row) |
| **Users** | email, role (`free` \| `premium`) |
| **Matches** | external id, home/away team, league, kickoff, published flag, standings |
| **Predictions** | match, type (`1X2` / `DoubleChance` / `UnderOver` / `Surprise` / `Comeback`), value, odds, confidence, notes, `is_automated`, approval status, result (`win`/`loss`/`pending`) |
| **Live scores** | match, home/away score, minute, halftime score, status, logos |
| **News** | title, body, image, category, published flag, timestamps |

### Works out of the box

No external accounts are required to run and demo the whole product:

- **No API-Football key?** → backend runs in **demo mode** with simulated live
  scores and odds.
- **No Firebase key?** → push runs in **mock mode** (notifications are logged).

---

## Architecture

```
┌─────────────────────────────── your machine / server ───────────────────────────┐
│  Docker                                                                          │
│  ┌───────────────┐     ┌────────────────────┐     ┌──────────────────────────┐  │
│  │  PostgreSQL 16 │◀────│  Backend (:3001)   │◀────│  Admin dashboard (:3000) │  │
│  │   (volume)     │     │  Express + Socket. │     │  Next.js (runs in your   │  │
│  │                │     │  IO + scanner      │     │  browser)                │  │
│  └───────────────┘     └────────────────────┘     └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                  ▲   REST + WebSocket
                          ┌───────┴────────┐
                          │  Mobile app    │  Flutter — web / Android / iOS
                          └────────────────┘
```

| Component | Stack | Port | Notes |
|-----------|-------|------|-------|
| **Backend** | Node.js 20, Express 5, Socket.IO, PostgreSQL | `3001` | REST + WebSocket; auto-migrates & seeds on boot |
| **Admin** | Next.js 16, React 19, Tailwind | `3000` | Manage matches, predictions, signals, news |
| **Mobile** | Flutter 3 (Dart) | — | Free & premium screens, live scores/odds |
| **Database** | PostgreSQL 16 | `5432` | Persistent Docker volume |

---

## Quick start (one click)

The fastest way to run the **whole server stack** (database + backend + admin) on
Windows, macOS, or Linux. Only requirement: **Docker Desktop** (see
[Prerequisites](#prerequisites)).

| OS | Do this |
|----|---------|
| **Windows** | Double-click **`start.bat`** |
| **macOS / Linux** | Run **`./start.sh`** in a terminal |

The script checks Docker, creates `.env` from `.env.example` on first run, builds
the images, launches everything, and waits until the backend is healthy. Then open:

- **Admin dashboard** → <http://localhost:3000>
- **Backend API** → <http://localhost:3001>
- **Login** → `admin@predictpro.local` / `admin123`

Stop with **`stop.bat`** (Windows) or **`./stop.sh`** (macOS/Linux).
Add `--clean` to also wipe the database volume.

> For the full walkthrough (mobile, real devices, config, troubleshooting) see
> **[`SETUP.md`](SETUP.md)**.

---

## Prerequisites

### Option A — Docker (recommended, one click)

Just install **Docker Desktop**, launch it once, and use the start scripts above.

| OS | Download |
|----|----------|
| Windows | <https://www.docker.com/products/docker-desktop/> (enable WSL 2) |
| macOS | <https://www.docker.com/products/docker-desktop/> |
| Linux | Docker Engine + Compose: <https://docs.docker.com/engine/install/> |

Verify: `docker --version` and `docker compose version` (or `docker-compose --version`).

### Option B — Manual (for active development)

| Tool | Version | Used by |
|------|---------|---------|
| Node.js | 20+ | backend, admin |
| PostgreSQL | 16+ | backend (or run just the DB in Docker) |
| Flutter | 3.x stable | mobile |

> **Flutter SDK** installs to `~/flutter`. Add it to your shell so `flutter`
> resolves in every terminal:
>
> ```bash
> export PATH="$HOME/flutter/bin:$PATH"    # add to ~/.bashrc or ~/.zshrc
> ```

### External services (optional)

Both have zero-config fallbacks, so they are **not** required for local use:

- **API-Football** — real match data, live scores, odds (`API_FOOTBALL_KEY`).
  Without it, the backend runs in **demo mode** (simulated live updates).
- **Firebase (FCM)** — real push to premium users (`FCM_SERVICE_ACCOUNT_PATH`,
  `FCM_ENABLED=true`). Without it, pushes run in **mock mode** (logged only).

---

## Manual setup (development)

Use this if you want hot-reload and to run the apps outside Docker.

### 1. Backend

```bash
cd backend
cp .env.example .env            # edit secrets before production

# Start only PostgreSQL in Docker (or use a local Postgres 16)
docker run -d --name predict-pro-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=predict_pro -p 5432:5432 postgres:16-alpine

npm install
npm run migrate && npm run seed  # also runs automatically on `npm run dev`
npm run dev                      # http://localhost:3001
```

### 2. Admin dashboard

```bash
cd admin
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev                      # http://localhost:3000
```

### 3. Mobile app

See [Mobile app](#mobile-app) below.

---

## Mobile app

The backend must be running first (one-click or manual).

### Helper script (recommended)

```bash
# macOS / Linux
cd mobile && ./run.sh

# Windows
cd mobile
powershell -ExecutionPolicy Bypass -File run.ps1
```

You'll pick a target:

| Target | Use for | Backend host used |
|--------|---------|-------------------|
| **chrome** | Quick demo in a browser | `localhost:3001` |
| **android** | Emulator or USB device | `10.0.2.2:3001` (emulator loopback) |
| **apk** | Build a shareable `.apk` | `localhost:3001` (override with LAN IP) |

The script finds Flutter on your `PATH` or at `~/flutter/bin`, runs
`flutter pub get`, and passes the correct backend URL via `--dart-define`.

### Manual

```bash
export PATH="$HOME/flutter/bin:$PATH"
cd mobile
flutter pub get
flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:3001 \
  --dart-define=WS_BASE_URL=http://localhost:3001
```

### Installing on a real phone (Android)

1. Find your computer's LAN IP (`ipconfig` on Windows; `ip a` / `ifconfig` on
   macOS/Linux) — phone and computer must share the same Wi-Fi.
2. Build: `./run.sh apk 192.168.1.20` (use your IP).
3. Install `mobile/build/app/outputs/flutter-apk/app-release.apk` on the phone
   (enable "Install unknown apps").

> **iOS** device installs require a Mac with Xcode and an Apple Developer account.
> For a quick demo on any OS, use the **chrome** target.

---

## Default accounts

| Where | Email | Password | Role |
|-------|-------|----------|------|
| Admin dashboard | `admin@predictpro.local` | `admin123` | admin |
| Mobile app | `free@predictpro.local` | — (email only) | free |
| Mobile app | `premium@predictpro.local` | — (email only) | premium |

Change the admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` (see below).

---

## Configuration

All settings live in the root **`.env`** (for Docker) and each app's `.env` /
`.env.local` (for manual runs). Every value has a safe default. **Never commit
`.env` files.**

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `BACKEND_PORT` / `ADMIN_PORT` / `POSTGRES_PORT` | root `.env` | `3001` / `3000` / `5432` | Host ports (change if in use) |
| `NODE_ENV` | root / backend | `development` | `development` syncs admin password from env; `production` locks CORS |
| `DATABASE_URL` | backend | local Postgres | Connection string |
| `JWT_SECRET` | backend | dev value | **Change for production** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | backend | `admin@predictpro.local` / `admin123` | Admin login (seeded on first run) |
| `CORS_ORIGINS` | backend | `localhost:3000,3001` | Allowed browser origins |
| `API_FOOTBALL_KEY` | backend | empty → demo mode | Real match/odds data |
| `LIVE_DEMO_MODE` | backend | `true` | Simulate live scores without a key |
| `FCM_ENABLED` / `FCM_SERVICE_ACCOUNT_PATH` | backend | `false` / empty → mock | Real push notifications |
| `NEXT_PUBLIC_API_URL` | admin | `http://localhost:3001` | Backend URL baked into the admin build |

After editing the root `.env`, re-run the start script to apply changes.

---

## Feature access matrix

| Feature | Admin | Free user | Premium user |
|---------|-------|-----------|--------------|
| Publish predictions & news | ✅ | — | — |
| Home, Live Scores, 1X2, Under/Over, News, My Predictions | — | ✅ | ✅ |
| Automated Surprise / Comeback signals | Approve / Reject | 🔒 Locked | ✅ View |
| Signal history & analytics | — | 🔒 Locked | ✅ View |
| Live odds (WebSocket) | — | Static snapshot | ✅ Real-time |
| Push on approved signal | Toggle on/off | — | ✅ Receives |

---

## Project structure

```
predict-pro/
├── backend/            # Node.js + Express + PostgreSQL + Socket.IO
│   ├── src/            # feature modules: auth, matches, predictions, news,
│   │                   #   live, scanner, socket, fcm, admin, analytics
│   ├── migrations/     # SQL migrations (auto-applied on boot)
│   ├── test/           # node:test API/socket/scanner tests
│   └── Dockerfile
├── admin/              # Next.js 16 + Tailwind admin dashboard
│   ├── src/app/        # login + dashboard routes
│   ├── src/components/ # shared UI (states, buttons, tables)
│   └── Dockerfile
├── mobile/             # Flutter app (web / Android / iOS)
│   ├── lib/            # config, models, services, providers, screens, widgets
│   └── run.sh / run.ps1
├── docker-compose.yml  # full stack: postgres + backend + admin
├── start.* / stop.*    # one-click launchers (sh / ps1 / bat)
├── .env.example        # root env for Docker Compose
├── SETUP.md            # detailed cross-platform setup guide
├── TODO.md             # section-by-section build checklist
└── predict-pro-cursor-spec.md  # product spec (Phase 1)
```

---

## Common commands

| Action | Command |
|--------|---------|
| Start / rebuild stack | `./start.sh` · `start.bat` |
| Stop (keep data) | `./stop.sh` · `stop.bat` |
| Stop + wipe database | `./stop.sh --clean` · `stop.bat --clean` |
| View all logs | `docker compose logs -f` |
| Backend logs only | `docker compose logs -f backend` |
| Restart one service | `docker compose restart backend` |
| Rebuild from scratch | `docker compose down -v && ./start.sh` |

> If your Docker uses the standalone binary, replace `docker compose` with
> `docker-compose`. The start/stop scripts detect this automatically.

---

## Tests

```bash
cd backend && npm test     # API, socket, scanner (node:test)
cd admin   && npm test     # API error-handling smoke tests
cd mobile  && flutter test # widget + unit smoke tests
```

Backend tests run with `--test-concurrency=1` (already set in `package.json`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Docker is not installed` / `not running` | Install & launch Docker Desktop; wait until it says "running". |
| Port already in use (3000 / 3001 / 5432) | Change `ADMIN_PORT` / `BACKEND_PORT` / `POSTGRES_PORT` in `.env`, re-run start. |
| Admin login fails | Keep `NODE_ENV=development` (password syncs from env), or wipe data: `stop --clean` then start. |
| Admin can't reach API | Open <http://localhost:3001/health> — should return `{"status":"ok"}`. |
| `flutter: command not found` | `export PATH="$HOME/flutter/bin:$PATH"` (run scripts also try `~/flutter/bin`). |
| Mobile "Unable to reach the API" | Web/desktop use `localhost`; Android emulator uses `10.0.2.2`; real device needs your PC's LAN IP. |
| Changed `.env`, no effect | Re-run the start script (it rebuilds affected images). |

---

## Production notes

Before deploying to real users:

- Set a strong `JWT_SECRET` and a real `ADMIN_PASSWORD`.
- Set `NODE_ENV=production` and restrict `CORS_ORIGINS` to your domain(s).
- Serve backend and admin behind HTTPS (reverse proxy such as Caddy/Nginx).
- Use a managed/backed-up PostgreSQL (or a persistent, backed-up volume).
- Configure `API_FOOTBALL_KEY` (live data) and Firebase/FCM (real push).

---

## Out of scope (Phase 1)

Confirmed **not** included in this build:

- Payments / subscriptions / in-app purchases
- User self-registration or password auth (roles are set manually in the DB)
- Telegram, Discord, or other external-platform sharing
- Multi-admin accounts

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`SETUP.md`](SETUP.md) | Detailed cross-platform setup (server + mobile), troubleshooting, production |
| [`backend/README.md`](backend/README.md) | Full API reference, WebSocket events, scanner & FCM behavior |
| [`mobile/README.md`](mobile/README.md) | Mobile run/build details, screens, config |
| [`TODO.md`](TODO.md) | Section-by-section build checklist |
| `predict-pro-cursor-spec.md` | Phase 1 product specification |

**Build status:** all sections 0–7 complete.
