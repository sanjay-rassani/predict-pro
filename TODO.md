# Predict Pro — Build TODO

Master checklist for building Predict Pro (Phase 1) per `predict-pro-cursor-spec.md`, plus agreed scope extensions (draft/archive predictions, admin search & stats, signal history filters, CSV export).

**Rules of engagement**
- Build strictly in section order. Finish and verify a whole section (all its checkpoints ticked) before starting the next.
- Keep code modular: one folder/module per feature (`matches/`, `predictions/`, `news/`, `auth/`, `scanner/`, ...).
- All secrets/keys via environment variables — never hardcode.
- If a section isn't fully working, stop and fix before moving on.

**Repo layout (target)**
```
predict-pro/
├── backend/        # Node.js + Express + PostgreSQL + Socket.IO
├── admin/          # Next.js + Tailwind admin dashboard
└── mobile/         # Flutter app
```

**Progress**
- [x] Section 0 — Project Scaffolding & Tooling
- [x] Section 1 — Backend Foundation (DB, Auth, Core REST)
- [x] Section 2 — Live Scores & Odds via WebSocket
- [x] Section 3 — Admin Dashboard (Next.js)
- [x] Section 4 — Automated Scanner + FCM Push
- [ ] Section 5 — Flutter App: Free Screens
- [ ] Section 6 — Flutter App: Premium Screens
- [ ] Section 7 — Polish, Testing & Hardening

---

## Section 0 — Project Scaffolding & Tooling
Goal: monorepo structure, env conventions, and shared config in place.

### Checkpoint 0.1 — Repo structure
- [x] Create `backend/`, `admin/`, `mobile/` top-level folders
- [x] Add root-level `README.md` section describing the three apps and how to run each
- [x] Confirm root `.gitignore` covers Node, Next.js, Flutter, `.env` files

### Checkpoint 0.2 — Environment conventions
- [x] Create `backend/.env.example` (DB URL, JWT secret, API-Football key, FCM creds, port)
- [x] Create `admin/.env.example` (backend base URL, admin session secret)
- [x] Document required env vars in each app's README
- [x] Verify no secrets are committed (only `.example` files tracked)

### Checkpoint 0.3 — Tooling baseline
- [x] Backend: init `package.json`, add lint/format (ESLint + Prettier), `npm run dev` script
- [x] Admin: init Next.js + Tailwind, confirm dev server runs
- [x] Mobile: init Flutter project, confirm it builds/runs on emulator

---

## Section 1 — Backend Foundation (DB, Auth, Core REST)
Goal: Express server, Postgres schema/migrations, single-admin JWT auth, REST for matches/predictions/news.

### Checkpoint 1.1 — Server bootstrap
- [x] Express app with modular folder structure (feature folders)
- [x] Central config loader reading from env (no hardcoded secrets)
- [x] Health-check endpoint `GET /health`
- [x] CORS, JSON body parsing, request logging, error-handling middleware

### Checkpoint 1.2 — Database & migrations
- [x] PostgreSQL connection pool + migration tool chosen (e.g. node-pg-migrate/Knex)
- [x] `admin_users` table (email, password_hash) — single account
- [x] `users` table (email, role: `free`|`premium`)
- [x] `matches` table (external API id, home/away team, league, datetime, published flag, standings/position)
- [x] `predictions` table (match_id, type, predicted_value, odds, confidence, notes, is_automated_signal, approval_status, result_status, publish_status: `draft`|`published`|`archived`)
- [x] `live_scores` table (match_id, home/away score, minute, halftime score, status, team logo URLs)
- [x] `news_articles` table (title, body, image, category, published flag, timestamps)
- [x] Migrations run cleanly up and down

### Checkpoint 1.3 — Single-admin JWT auth
- [x] Seed/create the single admin account (from env or seed script, hashed password)
- [x] `POST /auth/admin/login` → returns JWT
- [x] Auth middleware to protect admin routes
- [x] Reject creating additional admin accounts (single-admin enforced)

### Checkpoint 1.4 — Matches REST
- [x] API-Football client module (key from env, quota-aware)
- [x] Sync/import upcoming & active matches into `matches`
- [x] `GET /matches` (with date/league/market filters + search query for team/match name)
- [x] `GET /matches/:id`
- [x] Admin: publish/unpublish match

### Checkpoint 1.5 — Predictions REST
- [x] `POST /predictions` (admin, manual: 1X2 / DoubleChance / UnderOver) — support `publish_status=draft` or `published`
- [x] Publish draft → `publish_status=published`, `is_automated_signal=false`, `approval_status=approved` (visible in app immediately)
- [x] `GET /predictions` (filter by type, publish_status, approval_status; exclude archived by default)
- [x] `PATCH /predictions/:id` (edit draft or published)
- [x] Archive prediction → `publish_status=archived` (hidden from app, retained in admin)
- [x] Hard delete only when needed; prefer archive over delete
- [x] Result status update endpoint (`win`/`loss`) for My Predictions history

### Checkpoint 1.8 — Admin stats & export
- [x] `GET /admin/stats` — Today's Matches, Live Matches, Published Predictions, Pending Signals, Premium Users
- [x] `GET /admin/export/predictions` — CSV download (filterable by date range, type, league)
- [x] `GET /admin/export/signal-history` — CSV download (Surprise + Comeback history with win/loss)
- [x] `GET /analytics/signals` — signal history with filters: Today, Last 7 Days, Last 30 Days, League

### Checkpoint 1.6 — News REST
- [x] `POST /news`, `PATCH /news/:id`, `DELETE /news/:id` (admin)
- [x] `GET /news` (only `published` for app consumers)
- [x] Category support (injury/transfer/lineup/general)

### Checkpoint 1.7 — Verify
- [x] All endpoints tested (manual/HTTP client or automated)
- [x] Role field respected where relevant; secrets only from env

---

## Section 2 — Live Scores & Odds via WebSocket
Goal: Socket.IO server pushing live score, standings, and odds updates.

### Checkpoint 2.1 — Socket.IO server
- [x] Attach Socket.IO to Express server
- [x] Room/namespace strategy (e.g. per-match rooms)
- [x] Connection auth/handshake (identify role for premium-only odds streams)

### Checkpoint 2.2 — Live data polling → push
- [x] Poller pulls live match data from API-Football on an interval
- [x] Upsert into `live_scores` (score, minute, halftime, status, logos)
- [x] Emit live score/standings updates to subscribed clients

### Checkpoint 2.3 — Odds handling
- [x] Store odds snapshot on prediction at publish time (for Free users)
- [x] Emit live odds updates over WebSocket (Premium only)
- [x] Free users receive static snapshot; Premium receive live stream

### Checkpoint 2.4 — Verify
- [x] Manual WebSocket client confirms live score + odds events
- [x] Premium vs Free odds behavior verified

---

## Section 3 — Admin Dashboard (Next.js)
Goal: full admin control surface with Tailwind UI.

### Checkpoint 3.1 — Auth & shell
- [x] Login page (email/password) → JWT session
- [x] Protected layout/route guard; logout
- [x] Base navigation shell
- [x] Dashboard stats cards: Today's Matches, Live Matches, Published Predictions, Pending Signals, Premium Users

### Checkpoint 3.2 — Matches table
- [x] Table of upcoming/active matches from backend
- [x] Filters: date, league, market
- [x] Search bar to quickly find matches or teams (backed by `GET /matches?search=`)
- [x] Publish/unpublish action

### Checkpoint 3.3 — Manual entry modal
- [x] Modal from a match row with: Prediction Type dropdown, Live/Current Odds, Confidence Score, Notes/Analysis
- [x] **Save as Draft** → `publish_status=draft` (not visible in app)
- [x] **Publish** → `publish_status=published`, visible in app immediately
- [x] Draft list view: edit, publish, or archive drafts
- [x] Archive action on published predictions (replaces delete-only workflow)

### Checkpoint 3.4 — Approval queue
- [x] List all `pending` automated signals (Surprise + Comeback)
- [x] Approve → status `approved` (triggers push later in Section 4)
- [x] Reject → status `rejected` (hidden)

### Checkpoint 3.5 — News management
- [x] Create / edit / delete / publish news articles (title, body, image, category)
- [x] Only published articles surface to app

### Checkpoint 3.6 — Settings / API health
- [x] API quota usage + endpoint status panel
- [x] Toggle notification dispatch on/off

### Checkpoint 3.7 — Data export
- [x] Export predictions to CSV (with date/type/league filters)
- [x] Export signal history to CSV

### Checkpoint 3.8 — Verify
- [x] End-to-end admin flows work against live backend
- [x] Draft → publish, archive, search, stats, and CSV export all verified

---

## Section 4 — Automated Scanner + FCM Push
Goal: signal scanner that queues signals for approval, and push on approval.

### Checkpoint 4.1 — Scanner logic
- [x] Surprise rule: `live_home_team_odds > 4.00` → flag Surprise
- [x] Comeback rule: home losing by exactly 1 goal AND status `Halftime` → flag Comeback
- [x] Flagged signals saved `approval_status=pending`, `is_automated_signal=true`
- [x] Never auto-publishes — always lands in Approval Queue first

### Checkpoint 4.2 — FCM integration
- [x] Firebase Admin SDK configured via env creds
- [x] Store/manage premium user device tokens
- [x] On admin approval → send FCM push to premium users
- [x] Respect the settings dispatch on/off toggle

### Checkpoint 4.3 — Verify
- [x] Simulated live data triggers correct flags into queue
- [x] Approve fires push to premium devices only

---

## Section 5 — Flutter App: Free Screens
Goal: dark theme (purple `#6A0DAD`), free-tier screens working against backend.

### Checkpoint 5.1 — App foundation
- [ ] Flutter project theme (dark, purple accent `#6A0DAD`)
- [ ] Networking layer (REST client) + WebSocket client
- [ ] Simple auth/session + role awareness (free/premium)
- [ ] Navigation/routing skeleton

### Checkpoint 5.2 — Home
- [ ] Featured matches, upcoming fixtures, category tabs

### Checkpoint 5.3 — Live Scores
- [ ] Real-time via WebSocket: score, minute, halftime, status, team logos
- [ ] League standings

### Checkpoint 5.4 — 1X2 Predictions
- [ ] Published matches with 1/X/2 selection boxes and odds

### Checkpoint 5.5 — Under/Over
- [ ] Separate tab: Over 2.5 / Under 2.5 predictions with odds

### Checkpoint 5.6 — News
- [ ] Feed of published articles (injuries, transfers, lineups)

### Checkpoint 5.7 — My Predictions
- [ ] History with GREEN=win / RED=loss badges (no profit/loss math)

### Checkpoint 5.8 — Verify
- [ ] All free screens load real data; live scores update in real time

---

## Section 6 — Flutter App: Premium Screens
Goal: premium screens, role-based routing, and lock screens for free users.

### Checkpoint 6.1 — Role-based routing & lock screen
- [ ] Premium Lock screen placeholder: "Upgrade to Premium to unlock real-time smart signals."
- [ ] Free users hitting locked screens (5, 6, 9) see lock placeholder (no purchase flow)

### Checkpoint 6.2 — Odds Surprises (Premium)
- [ ] Live feed of approved Surprise signals with real-time odds detail

### Checkpoint 6.3 — Game Back / Comeback Signals (Premium)
- [ ] Live feed of approved Comeback signals with real-time odds detail

### Checkpoint 6.4 — Signal History & Analytics (Premium)
- [ ] Total signals, wins, losses, success rate %, grouped by Surprise vs Comeback
- [ ] Filters: Today, Last 7 Days, Last 30 Days, League

### Checkpoint 6.5 — Live odds & push
- [ ] Real-time odds updates for premium screens via WebSocket
- [ ] FCM push received on approved signals

### Checkpoint 6.6 — Verify
- [ ] Premium account sees signals/odds; free account sees locks

---

## Section 7 — Polish, Testing & Hardening
Goal: production-quality edges.

### Checkpoint 7.1 — UX states
- [ ] Loading, empty, and error states across app + admin

### Checkpoint 7.2 — Error handling
- [ ] Consistent API error responses; client-side handling
- [ ] Graceful WebSocket reconnect

### Checkpoint 7.3 — Tests
- [ ] Basic backend tests (auth, predictions, scanner logic)
- [ ] Basic admin + Flutter smoke tests

### Checkpoint 7.4 — Final review
- [ ] Feature Access Matrix behavior verified per role
- [ ] Scope extensions verified: drafts, archive, admin search/stats, signal history filters, CSV export
- [ ] No hardcoded secrets; envs documented
- [ ] Out-of-scope items confirmed excluded (payments, subscriptions, external platform sharing e.g. Telegram/Discord)
