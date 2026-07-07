# Predict Pro — Setup Guide (Windows · macOS · Linux · Mobile)

This guide gets the **entire platform** running on any machine with as close to
one click as possible.

- **Server stack** (database + backend API + admin dashboard) runs in **Docker** —
  identical on Windows, macOS, and Linux.
- **Mobile app** (Flutter) runs on web/Android/iOS with a helper script.

---

## TL;DR (one click)

| OS | Do this |
|----|---------|
| **Windows** | Double-click **`start.bat`** |
| **macOS / Linux** | Run **`./start.sh`** in a terminal |

Then open:

- **Admin dashboard** → http://localhost:3000
- **Backend API** → http://localhost:3001
- **Login** → `admin@predictpro.local` / `admin123`

To stop: **`stop.bat`** (Windows) or **`./stop.sh`** (macOS/Linux).

---

## 1. Prerequisites

### Server stack (required)

Install **Docker Desktop** — this is the only thing needed for the backend, admin,
and database.

| OS | Download |
|----|----------|
| Windows | https://www.docker.com/products/docker-desktop/ (enable WSL 2 when prompted) |
| macOS | https://www.docker.com/products/docker-desktop/ (Apple Silicon or Intel build) |
| Linux | Docker Engine + Compose plugin: https://docs.docker.com/engine/install/ |

After installing, **launch Docker Desktop once** and wait until it says "running".

> Verify in a terminal: `docker --version` and `docker compose version`.

### Mobile app (only if you want the phone app)

Install the **Flutter SDK**: https://docs.flutter.dev/get-started/install
Then run `flutter doctor` and follow any prompts (Android Studio for Android builds).

---

## 2. Start the server stack

### Windows
1. Open the project folder in File Explorer.
2. Double-click **`start.bat`**.
   (If SmartScreen warns, choose "More info" → "Run anyway".)

### macOS / Linux
```bash
cd predict-pro
./start.sh
```

**What the script does automatically:**
1. Checks Docker is installed and running.
2. Creates `.env` from `.env.example` (first run only).
3. Builds the backend + admin images and starts all three containers.
4. Waits for the backend health check.
5. Prints the URLs and login.

First run takes a few minutes (downloading images + building). Later runs are fast.

---

## 3. Use it

| What | URL / value |
|------|-------------|
| Admin dashboard | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| Admin login | `admin@predictpro.local` / `admin123` |

The app runs in **demo mode** by default: simulated live scores and odds, and
mock push notifications — no external API keys needed.

---

## 4. Mobile app

Make sure the server stack is running first (step 2).

### Windows
```powershell
cd mobile
powershell -ExecutionPolicy Bypass -File run.ps1
```

### macOS / Linux
```bash
cd mobile
./run.sh
```

You'll be asked to pick a target:

| Target | Use for | Backend host used |
|--------|---------|-------------------|
| **chrome** | Quick demo in a browser | `localhost:3001` |
| **android** | Android emulator or USB device | `10.0.2.2:3001` (emulator) |
| **apk** | Build a shareable `.apk` file | `localhost:3001` (override for real devices) |

**Demo logins in the app:** `free@predictpro.local` (free tier) or
`premium@predictpro.local` (premium tier — unlocks Smart Signals).

### Installing on a real phone
1. Build the APK: `./run.sh apk <YOUR_PC_LAN_IP>` (e.g. `./run.sh apk 192.168.1.20`).
   - Find your IP: `ipconfig` (Windows) / `ifconfig` or `ip a` (macOS/Linux).
   - The phone and PC must be on the same Wi-Fi.
2. The APK is at `mobile/build/app/outputs/flutter-apk/app-release.apk`.
3. Copy it to the phone, enable "Install unknown apps", and open it.

> **iOS** requires a Mac with Xcode and an Apple Developer account for device
> installs. For a quick demo, use the **chrome** target instead.

---

## 5. Configuration (optional)

Everything is controlled by the root **`.env`** file (created on first start).
Edit it, then re-run `start` to apply. Common changes:

| Setting | Default | Notes |
|---------|---------|-------|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@predictpro.local` / `admin123` | Admin dashboard login |
| `BACKEND_PORT` / `ADMIN_PORT` | `3001` / `3000` | Change if ports are taken |
| `JWT_SECRET` | dev value | **Change for production** |
| `API_FOOTBALL_KEY` | empty (demo mode) | Real data from api-football.com |
| `FCM_ENABLED` | `false` (mock) | Real push needs Firebase (see below) |

### Real live data (API-Football)
1. Get a key at https://www.api-football.com/.
2. In `.env`: set `API_FOOTBALL_KEY=your_key` and `LIVE_DEMO_MODE=false`.
3. Re-run `start`.

### Real push notifications (Firebase)
1. Create a Firebase project and download the service-account JSON.
2. Mount it into the backend container and set `FCM_ENABLED=true` +
   `FCM_SERVICE_ACCOUNT_PATH`. (Ask your developer — this needs a volume mount.)
Without this, pushes are logged in mock mode and the app still works.

---

## 6. Everyday commands

| Action | Command |
|--------|---------|
| Start / rebuild | `./start.sh` · `start.bat` |
| Stop (keep data) | `./stop.sh` · `stop.bat` |
| Stop + wipe database | `./stop.sh --clean` · `stop.bat --clean` |
| View logs | `docker compose logs -f` |
| Backend logs only | `docker compose logs -f backend` |
| Restart one service | `docker compose restart backend` |

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Docker is not installed` / `not running` | Install & launch Docker Desktop; wait until it's running. |
| Port already in use (3000/3001/5432) | Edit `BACKEND_PORT` / `ADMIN_PORT` / `POSTGRES_PORT` in `.env`, re-run start. |
| Admin login fails | Ensure `NODE_ENV=development` in `.env` (password syncs), or wipe data: `stop --clean` then start. |
| Admin can't reach API | Confirm backend is healthy: open http://localhost:3001/health. |
| Changed `.env` but nothing changed | Re-run `start` (it rebuilds). For admin URL changes, the image rebuilds automatically. |
| `flutter: command not found` | Add Flutter to PATH: `export PATH="$HOME/flutter/bin:$PATH"` (the run scripts also try `~/flutter/bin`). |
| Mobile app shows "Unable to reach the API" | Web/desktop use `localhost`; Android emulator uses `10.0.2.2`; real device needs your PC's LAN IP (see §4). |
| Rebuild from scratch | `docker compose down -v` then `./start.sh`. |

---

## 8. What runs where

```
┌─────────────────────────── your machine ───────────────────────────┐
│  Docker                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐ │
│  │ postgres:16   │◀──│ backend (3001)│◀──│ admin dashboard (3000)│ │
│  │  (volume)     │   │ Express + WS  │   │ Next.js (browser)     │ │
│  └───────────────┘   └───────────────┘   └───────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
          ▲                        ▲
          │                        │  REST + WebSocket
          │                 ┌──────┴────────┐
          │                 │  Mobile app   │  (Flutter: web / Android / iOS)
          └─────────────────┤  Flutter      │
                            └───────────────┘
```

- **Data persists** in the `predict_pro_pg` Docker volume across restarts.
- Only `stop --clean` (or `docker compose down -v`) deletes it.

---

## 9. Production notes (before real deployment)

- Set a strong `JWT_SECRET` and a real `ADMIN_PASSWORD`.
- Set `NODE_ENV=production` and lock `CORS_ORIGINS` to your real domain(s).
- Put the backend/admin behind HTTPS (reverse proxy such as Caddy/Nginx).
- Use a managed PostgreSQL or a backed-up volume.
- Configure API-Football and Firebase for live data and real push.

See `predict-pro-cursor-spec.md` for the product spec and `TODO.md` for the build
checklist.
