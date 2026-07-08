<!-- markdownlint-disable MD013 MD033 -->
# Predict Pro — Client Demo Playbook

A complete, step-by-step script to present the product end-to-end: admin, free
user, premium user, real-time updates, automated signals, push notifications,
user management, and every important edge case.

> **Total run time:** ~20–25 min for the full demo, or ~8 min for the "highlights"
> path (marked with ⭐).

---

## Table of contents

1. [Before the demo (prep checklist)](#1-before-the-demo-prep-checklist)
2. [The 30-second pitch](#2-the-30-second-pitch)
3. [Demo map (what you'll show)](#3-demo-map-what-youll-show)
4. [Act 1 — Admin dashboard](#act-1--admin-dashboard-4-min)
5. [Act 2 — Publish content](#act-2--publish-content-4-min)
6. [Act 3 — Create users (with passwords)](#act-3--create-users-with-passwords-2-min)
7. [Act 4 — Mobile app: Free user](#act-4--mobile-app-free-user-4-min)
8. [Act 5 — Automated signals + approval + push](#act-5--automated-signals--approval--push-4-min)
9. [Act 6 — Mobile app: Premium user](#act-6--mobile-app-premium-user-4-min)
10. [Act 7 — Real-time proof (side-by-side)](#act-7--real-time-proof-side-by-side-2-min)
11. [Edge cases & robustness](#edge-cases--robustness-cover-every-case)
12. [Coverage checklist (tick every feature)](#coverage-checklist-tick-every-feature)
13. [Anticipated client questions (Q&A)](#anticipated-client-questions-qa)
14. [Reset between runs](#reset-between-runs)
15. [Live-demo troubleshooting](#live-demo-troubleshooting)

---

## 1. Before the demo (prep checklist)

Do this **30 minutes before**, on the machine you'll present from.

### 1.1 Start the stack

```bash
# From the repo root
./start.sh          # macOS/Linux   (Windows: start.bat)
```

Wait until it reports the backend is healthy. Then confirm all three are up:

- Backend health → open <http://localhost:3001/health> → should show `{"status":"ok","db":"connected"}`
- Admin dashboard → <http://localhost:3000>
- Mobile app → run it (see 1.3)

### 1.2 ⭐ Speed up the demo match (IMPORTANT)

The backend simulates a live match that advances **one minute per poll**. The
default poll is every 30s, so an automated signal would take ~10 minutes to
appear. For a smooth demo, make it advance every 2 seconds.

Set this in the backend environment and restart the backend:

```bash
# root .env  (or backend/.env if running manually)
LIVE_POLL_INTERVAL_MS=2000
```

With this, the simulated match reaches the **Surprise** window in ~40s and the
**Comeback** (halftime) moment in ~90s. Restart the stack after changing it.

> No API-Football key or Firebase key is needed — the app ships with **demo
> mode** (simulated live scores/odds) and **mock push** (logged), so the whole
> demo works fully offline. Mention this; clients love that it "just runs".

### 1.3 Have the mobile app ready

Easiest for a demo is Chrome (works on any OS):

```bash
cd mobile && ./run.sh        # choose "chrome"   (Windows: run.ps1)
```

Open **two** app windows/instances if you can (one Free, one Premium) so you can
show the difference side by side. On Chrome you can use a normal window + an
incognito window.

### 1.4 Accounts you'll use

| Role | Where | Email | Password |
|------|-------|-------|----------|
| Admin | Dashboard `:3000` | `admin@predictpro.local` | `admin123` |
| Free user | Mobile app | `free@predictpro.local` | `free123` |
| Premium user | Mobile app | `premium@predictpro.local` | `premium123` |

### 1.5 Open these browser tabs in advance

1. Admin login (`:3000`)
2. `http://localhost:3001/health` (proof the API is live)
3. Mobile app window #1 (Free)
4. Mobile app window #2 (Premium)

### 1.6 Final pre-flight

- [ ] `./start.sh` finished, health is OK
- [ ] `LIVE_POLL_INTERVAL_MS=2000` applied + backend restarted
- [ ] Logged into admin once (so the token is fresh)
- [ ] Mobile app opens and shows the login screen
- [ ] Notifications toggle is **ON** in admin **Settings** (for the push demo)
- [ ] Do a full dry-run once end-to-end

---

## 2. The 30-second pitch

> "Predict Pro is a football predictions and live-signals platform. One admin
> curates everything — match predictions, news, and automated 'smart signals' —
> from a web dashboard. Fans use a mobile app: **free** users get live scores,
> predictions and news; **premium** users additionally get real-time automated
> signals, live odds, analytics, and push notifications. It's three parts — a
> backend API, an admin web app, and a Flutter mobile app — and it runs fully
> out of the box, no external accounts required."

---

## 3. Demo map (what you'll show)

```
Admin (web)                         Mobile app (free)        Mobile app (premium)
──────────────                      ─────────────────        ────────────────────
Login → Dashboard stats            Login (email+password)    Everything free +
Matches → Manual predictions       Home / fixtures           Odds Surprises (live)
News → publish                     Live Scores (real-time)   Game Back (live)
Users → create free/premium        1X2 / Under-Over          Live odds (real-time)
Approval Queue → approve signal    News                      Signal History/Analytics
Settings → push toggle             My Predictions            Receives push
                                   Premium screens = LOCKED
```

---

## Act 1 — Admin dashboard (4 min)

**Goal:** show the control center and that the system has real data.

1. Go to `:3000`, log in as **admin** (`admin@predictpro.local` / `admin123`).
   - *Say:* "Single secure admin account, JWT-based session."
2. Land on **Dashboard**. Point out the live stat cards: today's matches, live
   matches, published predictions, pending signals, premium users.
3. Walk the left nav briefly: Matches, Drafts, Approval Queue, News, Users,
   Settings. "Everything the business needs is here; the mobile app is read-only
   for users."

⭐ **Highlights path:** log in, glance at stats, move on.

---

## Act 2 — Publish content (4 min)

**Goal:** show how predictions and news get created and reach the app.

### 2.1 Seed a demo match

1. Go to **Matches**.
2. Click **+ Demo match**. A "Demo Home FC vs Demo Away United" (Premier League)
   row appears, already published.
   - *Say:* "In production these sync from API-Football by date/league/market;
     for the demo we inject one instantly." Point out the date/league/market/team
     **filters** at the top.

### 2.2 Publish a manual prediction (1X2)

1. On the demo match row, click **Predict**.
2. In the modal: Type **1X2**, Predicted value **1**, Odds e.g. **2.10**,
   Confidence **75**, add a note.
3. Click **Publish**. (Show **Save as Draft** too — "drafts stay hidden until
   published"; drafts live under the **Drafts** tab.)

### 2.3 Publish an Under/Over prediction

1. **Predict** again → Type **Under/Over 2.5**, Predicted value **Over 2.5**,
   Odds **1.90** → **Publish**.
   - *Say:* "Two prediction markets for fans: match result and goals line."

### 2.4 Publish news

1. Go to **News** → **+ New article**.
2. Title "Star striker returns from injury", category **Injury**, write a body,
   tick **Published**, **Save**.
   - *Say:* "Only published articles show in the app — you can stage drafts."

---

## Act 3 — Create users (with passwords) (2 min)

**Goal:** show self-serve user management with proper credentials.

1. Go to **Users**. Show the existing demo users and their **role badges**
   (Free / Premium).
2. Click **+ New user**: email `demo.client@predictpro.local`, role **Premium**,
   set a password (min 6 chars), **Save**.
   - *Say:* "Passwords are bcrypt-hashed; the API never returns them."
3. Show **Edit** on a user → you can change the tier (free ↔ premium) or reset
   the password ("leave blank to keep").
   - *Say:* "This is how you upgrade someone to Premium — no payment system in
     this phase, it's a controlled role flag."

> Tip: you can log into the app later with this new user to prove creation works
> end-to-end.

---

## Act 4 — Mobile app: Free user (4 min)

**Goal:** show the everyday fan experience and the premium paywall.

1. In mobile window #1, log in with `free@predictpro.local` / `free123`.
   - Show the password field + show/hide toggle. Use the **"Free user"** quick
     chip to autofill.
2. **Home** — featured/upcoming fixtures, category tabs.
3. **Live Scores** — the demo match is live; watch score/minute/status update
   **by themselves** (real-time via WebSocket). Point out league standings.
4. **1X2** — the prediction you published appears with the 1/X/2 pick and odds.
5. **Under/Over** — your Over 2.5 prediction appears.
6. **News** — the injury article you published is here.
7. **My Predictions** — history with **green = win / red = loss** badges.
8. Tap a **premium** area (Odds Surprises / Game Back / Signal History).
   - *Show:* the **Premium Lock** screen: "Upgrade to Premium to unlock
     real-time smart signals." *Say:* "Clear upsell, no dead ends."

⭐ **Highlights path:** Live Scores (real-time) + 1X2 + the premium lock.

---

## Act 5 — Automated signals + approval + push (4 min)

**Goal:** the flagship feature — the scanner, human approval, and push.

*Say first:* "The system watches live data and auto-detects two opportunities:
a **Surprise** (an underdog's odds spike) and a **Comeback** when a team is down
by one at halftime. Nothing auto-publishes — it always goes to an admin approval
queue first."

1. Keep the demo match running (with `LIVE_POLL_INTERVAL_MS=2000` it advances
   fast). Within ~40–90s the scanner flags signals.
2. In admin, open **Approval Queue**. A **Surprise** (and soon a **Comeback**)
   signal appears with the match, pick, odds, and an auto-generated note.
   - *Say:* "This is the human-in-the-loop control — the expert vets every signal."
3. Make sure **Settings → notifications dispatch** is **ON**.
4. Click **Approve** on a signal.
   - *Say:* "Approving publishes it to premium users **and** fires a push
     notification to their devices." (In demo mode the push is mocked and logged
     by the backend — you can show the backend terminal line
     `[fcm] Mock push to N premium device(s)`.)
5. Show **Reject** exists too → "rejected signals are hidden, never shown."

> If signals are slow to appear, you can talk through the logic on-screen while
> waiting, or lower the poll interval further (e.g. `1000`).

---

## Act 6 — Mobile app: Premium user (4 min)

**Goal:** show the premium value and live odds.

1. In mobile window #2, log in with `premium@predictpro.local` / `premium123`
   (use the **"Premium user"** chip).
2. **Odds Surprises** — the approved Surprise signal is now visible here with its
   details. (For Free this was locked.)
3. **Game Back** — the approved Comeback signal shows here.
4. **Live odds** — on the premium signal/odds view, watch the odds numbers
   **update live** (WebSocket). *Say:* "Free users see a static odds snapshot from
   publish time; premium sees live odds."
5. **Signal History & Analytics** — totals, wins, losses, success-rate %, split
   by Surprise vs Comeback.
   - *Say:* "Transparent track record builds trust."

---

## Act 7 — Real-time proof (side-by-side) (2 min)

**Goal:** make the "real-time" claim undeniable.

1. Put the **Live Scores** screen (mobile) next to the admin/backend.
2. Let the demo match tick — the score/minute change on the phone with **no
   refresh**.
3. Approve another signal in admin → it **appears on the premium app** within a
   second, and the premium odds view keeps updating.
   - *Say:* "One backend, pushing to every client over WebSockets."

---

## Edge cases & robustness (cover every case)

Show these to prove it's production-minded, not just a happy-path demo.

### Authentication & access control
- **Wrong password:** try logging into the app with a bad password → clean
  "Invalid email or password" (same message for unknown email — no user
  enumeration).
- **Unknown user:** log in with an email that doesn't exist → same safe error.
- **Locked premium screens:** as Free, every premium area shows the upgrade lock,
  never a broken page.
- **Admin-only APIs:** mention all content/user endpoints require an admin JWT;
  the mobile app can't call them.

### User management validation
- **Duplicate email:** in admin **Users**, try creating a user with an existing
  email → friendly "A user with this email already exists" (409).
- **Short password:** try a password under 6 chars → "password must be at least
  6 characters" (validated on client and server).
- **Email normalization:** create `Mixed.Case@Example.com`; it's stored lowercase
  and login is case-insensitive.
- **Upgrade/downgrade:** edit a user's role and show the app behavior change on
  next login.

### Content workflow
- **Draft vs published:** a drafted prediction/news article does **not** appear in
  the app until published; show the **Drafts** tab.
- **Reject a signal:** rejected signals never reach users.
- **Archive:** a published prediction can be archived (removed from the app feed).

### UX states (loading / empty / error)
- **Empty states:** open the Approval Queue with nothing pending → "No pending
  signals"; a fresh user's My Predictions is empty with a friendly message.
- **Loading states:** spinners while data loads.
- **Error + retry:** stop the backend, refresh an admin table → clean error card
  with a **Retry** button (then restart backend and hit Retry). The mobile app
  shows "Unable to reach the API. Is the backend running?" instead of crashing.

### Resilience / "no external accounts needed"
- **No API-Football key:** running in demo mode — live scores/odds are simulated.
- **No Firebase key:** push runs in mock mode (logged), so approvals still work.
- **CORS in dev:** the backend accepts any `localhost:*` origin so the Flutter web
  app connects without config.
- **Cross-platform:** one-click `start.sh` / `start.bat` on Windows/macOS/Linux
  via Docker; the mobile helper picks the right backend URL per target
  (`localhost` for web, `10.0.2.2` for Android emulator, LAN IP for a real phone).

---

## Coverage checklist (tick every feature)

Use this to make sure you showed everything.

**Admin**
- [ ] Login (JWT)
- [ ] Dashboard stats
- [ ] Matches: demo/sync, filters (date/league/market/search), publish toggle
- [ ] Manual prediction: 1X2, Under/Over, Double Chance, draft vs publish, archive
- [ ] News: create/edit/delete, publish gating
- [ ] Users: create, edit role, reset password, delete, validation errors
- [ ] Approval Queue: approve + reject
- [ ] Settings: notifications toggle, API health

**Free user (mobile)**
- [ ] Email+password login (+ wrong password error)
- [ ] Home, Live Scores (real-time), Standings
- [ ] 1X2, Under/Over
- [ ] News
- [ ] My Predictions (win/loss badges)
- [ ] Premium lock screens

**Premium user (mobile)**
- [ ] Odds Surprises (approved signals)
- [ ] Game Back (approved comebacks)
- [ ] Live odds updating in real time
- [ ] Signal History & Analytics
- [ ] Receives push on approval (mock/real)

**Cross-cutting**
- [ ] Real-time WebSocket updates
- [ ] Role-based access (free vs premium vs admin)
- [ ] Loading / empty / error states
- [ ] Runs with no external keys (demo + mock modes)

---

## Anticipated client questions (Q&A)

- **"Is this real live data?"** In the demo it's simulated so it always works
  offline. In production, plug in an API-Football key and it uses real fixtures,
  scores, and odds — no code change, just an environment variable.
- **"How do users pay / become premium?"** Payments are intentionally out of
  scope for this phase. Premium is a controlled role you set in the admin Users
  screen. Payment gateways (Apple/Google/Stripe) are a Phase 2 add-on.
- **"Can anyone sign up?"** Not in this phase — the admin creates users. Self-
  registration can be added later.
- **"Are the signals automatic?"** Detection is automatic; publishing is not — an
  admin approves every signal, so you keep editorial control.
- **"Do notifications really work?"** Yes — wire in a Firebase service account and
  premium users get real push. Without it, it runs in a safe mock mode.
- **"What about security?"** Admin APIs require a JWT; passwords are bcrypt-hashed
  and never returned; errors don't leak whether an email exists; CORS is locked
  down in production.
- **"Will it run on our infrastructure?"** Yes — Docker Compose brings up
  Postgres + backend + admin with one command on any OS; the Flutter app builds
  for Android, iOS, and web.

---

## Reset between runs

To present again cleanly:

- **Light reset (keep accounts):** in admin, delete the demo predictions/news you
  created; the demo match can be re-added with **+ Demo match**.
- **Full reset (wipe everything):**

```bash
./stop.sh --clean     # Windows: stop.bat --clean   (wipes the database volume)
./start.sh            # fresh DB, migrations + demo users re-seeded automatically
```

After a full reset the three seeded accounts (admin/free/premium) are back with
the passwords in the table above.

---

## Live-demo troubleshooting

| Symptom | Fix on the spot |
|---------|-----------------|
| Signals not appearing in Approval Queue | Confirm `LIVE_POLL_INTERVAL_MS=2000` and backend restarted; a demo match exists; wait ~40–90s. |
| Push line not showing | Ensure **Settings → notifications** is ON and a premium device is "registered" (the app registers on login). |
| App shows "Unable to reach the API" | Backend not running or wrong URL — check <http://localhost:3001/health>. |
| Admin login fails | Keep `NODE_ENV=development` (password syncs from env), or do a full reset. |
| Admin table shows an error card | Backend was down — restart it and click **Retry**. |
| Port already in use | Change `BACKEND_PORT` / `ADMIN_PORT` / `POSTGRES_PORT` in `.env`, re-run `start`. |
| Real device can't connect | Use your PC's LAN IP: `./run.sh apk <LAN-IP>`; phone + PC on same Wi-Fi. |

---

### One-line close

> "Everything you saw — content, real-time scores, automated signals with human
> approval, premium gating, analytics, and push — runs today on one backend, a
> web admin, and a cross-platform app, with a clear path to live data and
> payments when you're ready."
