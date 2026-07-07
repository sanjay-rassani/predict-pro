# Predict Pro — Phase 1 Build Spec (for Cursor AI)

## 0. How to Use This Doc
Build strictly in the phase order in Section 9. Finish and test one phase before starting the next. Keep every module small and separated by feature (folders like `matches/`, `predictions/`, `news/`, `auth/`, `scanner/`).

---

## 1. Project Overview
Predict Pro is a football prediction & signals platform with a decoupled architecture: a Flutter mobile app for end users, and a completely separate Next.js admin web app (its own secure URL, not embedded in the mobile app), both talking to one shared backend. Admin manually publishes standard predictions (1X2, Under/Over) and news, and reviews automated "smart signals" (Surprise, Comeback) before they go live. Free users get the basics; Premium users additionally get live automated signals, real-time odds, and analytics. No payments in this phase — role is just a DB field, set manually.

---

## 2. Tech Stack (fixed — do not swap or offer alternatives)
- **Backend:** Node.js + Express + PostgreSQL + Socket.IO (for live score & odds push)
- **Admin Dashboard:** Next.js + Tailwind CSS
- **Mobile App:** Flutter (iOS & Android), dark theme, purple accent (`#6A0DAD`)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Football Data Source:** API-Football

---

## 3. User Roles
- **Admin** — exactly ONE account. Full control: create, edit, delete, and publish matches, predictions, and news. Approves/rejects automated signals. Views API/notification settings.
- **Free User** — basic live scores, manual predictions, news, own prediction history.
- **Premium User** — everything Free has, plus automated signals, live odds, and analytics.

---

## 4. Feature Access Matrix

| Feature | Admin | Free User | Premium User |
|---|---|---|---|
| Live Scores & Standings | View/Manage | View | View |
| Manual Predictions (1X2, Double Chance, Under/Over) | Create/Publish | View | View |
| Football News Feed | Create/Manage | View | View |
| My Predictions History (Win/Loss) | View logs | View | View |
| Automated Surprise Signals | Approve/Reject | 🔒 Locked | View |
| Automated Comeback ("Game Back") Signals | Approve/Reject | 🔒 Locked | View |
| Real-Time Odds Information | View/Manage | 🔒 Locked | View |
| Signal History & Analytics | View logs | 🔒 Locked | View |
| Instant Push Notifications | Auto-triggered | No | Yes |

**Paywall rule:** if a Free user opens a locked screen, show a lock-icon placeholder: *"Upgrade to Premium to unlock real-time smart signals."* No purchase flow behind it — just a locked state.

**Real-Time Odds definition:** Premium users see odds values that update live via WebSocket as they change on the data feed. Free users see a static odds snapshot taken at the moment the admin published the prediction.

---

## 5. Data You Need to Store
Design the actual schema/migrations yourself, but it must cover these entities and fields:

- **Admin Users** — email, hashed password. Only one row/account exists.
- **Users** — email, role (`free` | `premium`)
- **Matches** — external API id, home team, away team, league, match date/time, published flag, standings/league position data
- **Predictions** — linked match, type (`1X2` / `DoubleChance` / `UnderOver` / `Surprise` / `Comeback`), predicted value, odds, confidence score, admin notes, automated flag, approval status (`pending`/`approved`/`rejected`), result status (`pending`/`win`/`loss`)
- **Live Scores** — linked match, home score, away score, current minute, halftime score, match status, team logos (URLs)
- **News Articles** — title, body, image, category (injury/transfer/lineup/general), published flag, timestamps

---

## 6. Core Backend Logic

### A. Automated Signal Scanner
Flow: `Live Match Data → Scanner Checks Logic → Pushes to Admin Queue → Admin Approves → App Visible + Push Notification`

Never publishes automatically — always lands in the Admin Approval Queue first.

```js
// Surprise signal
if (live_home_team_odds > 4.00) {
  flag_as_surprise_signal();
}

// Comeback ("Game Back") signal
if (home_team_is_losing_by_exactly_1_goal && match_status === "Halftime") {
  flag_as_comeback_signal();
}
```
Flagged signals are saved with `approval_status = 'pending'` and `is_automated_signal = true`.

### B. Manual Predictions Workflow
Categories: 1X2, Double Chance, Under/Over 2.5.
Admin clicks a match → modal opens with: Prediction Type (dropdown), Live/Current Odds, Confidence Score (% or rating), Notes/Analysis (text area). On "Publish": insert with `is_automated_signal = false`, `approval_status = 'approved'` — visible in the app immediately.

### C. Approval Queue
Lists all `pending` automated signals (Surprise + Comeback) with **Approve** / **Reject** buttons.
- Approve → status becomes `approved`, appears in app, fires an FCM push to premium users.
- Reject → hidden from view (status = `rejected`).

### D. News Publishing Workflow
Admin creates/edits/deletes news articles (title, body, image, category). Only `published` articles appear in the app's News feed.

---

## 7. Screens

### Mobile App (Flutter)
1. **Home** — featured matches, upcoming fixtures, category tabs
2. **Live Scores** — real-time via WebSocket: score, match minute, halftime score, match status, team logos, **league standings**. Optional (nice-to-have, not required for MVP): tabs for live stats, cards, possession
3. **1X2 Predictions** — published matches with selection boxes (1/X/2) and odds
4. **Under/Over** — separate tab, Over 2.5 / Under 2.5 predictions with odds
5. **Odds Surprises** (Premium) — live feed of approved Surprise signals with real-time odds detail. Locked placeholder for Free users
6. **Game Back / Comeback Signals** (Premium) — live feed of approved Comeback signals with real-time odds detail. Locked placeholder for Free users
7. **News** — articles published by admin (injuries, transfers, lineups)
8. **My Predictions** — history with GREEN=win / RED=loss badges only, no profit/loss math
9. **Signal History & Analytics** (Premium) — total signals, wins, losses, success rate %, grouped by Surprise vs Comeback
10. **Premium Lock screen** — shown instead of any locked screen (5, 6, 9) for Free users

### Admin Dashboard (Next.js)
1. **Login** — single admin account, email/password, JWT session
2. **Matches Table** — upcoming/active matches from API-Football, filter by date, league, and market
3. **Manual Entry Modal** — form described in 6B
4. **Approval Queue** — pending automated signals with Approve/Reject (6C)
5. **News Management** — create/edit/delete/publish news articles
6. **Settings / API Health** — API quota usage, endpoint status, toggle notification dispatch on/off

---

## 8. Out of Scope (do not build — Phase 2)
- Payment gateways (Apple IAP, Google Play Billing, Stripe)
- Subscription lifecycle (renewals, billing failures, cancellations)
- Exporting/sharing predictions to Telegram, Discord, or any external platform

---

## 9. Recommended Build Order
Build and verify each phase before moving to the next.

1. **Backend foundation** — DB setup, models/migrations, single-admin JWT auth, REST endpoints for matches, predictions, and news
2. **Live scores via WebSocket** — Socket.IO server, live score + standings + odds updates
3. **Admin dashboard** — login, matches table (date/league/market filters), manual entry modal, approval queue, news management, settings/API health panel
4. **Automated scanner + FCM** — scanner logic from 6A, push notifications on approval
5. **Flutter app — free screens** — Home, Live Scores, 1X2, Under/Over, News, My Predictions
6. **Flutter app — premium screens** — Odds Surprises, Game Back, Signal History, live odds detail, role-based routing, lock screen
7. **Polish** — error handling, empty states, loading states, basic tests

---

## 10. Ground Rules
- Use environment variables for all API keys and secrets — never hardcode them
- Keep code modular: one folder/module per feature
- Prefer standard, well-known patterns over clever/custom ones
- Only one admin account is needed — don't build multi-admin/team features
- If a phase isn't fully working, stop and fix it before starting the next one
