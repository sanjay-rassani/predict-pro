# Predict Pro — Backend

Node.js + Express + PostgreSQL API for Predict Pro.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker — see below)

## Quick start

```bash
cp .env.example .env   # edit if needed
docker run -d --name predict-pro-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=predict_pro -p 5432:5432 postgres:16-alpine
npm install
npm run migrate
npm run seed
npm run dev            # http://localhost:3001
```

Migrations and seed also run automatically on `npm run dev` / `npm start`.

## Scripts

| Script                 | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start server with watch mode |
| `npm run migrate`      | Apply DB migrations          |
| `npm run migrate:down` | Revert migrations            |
| `npm run seed`         | Seed admin + demo users      |
| `npm test`             | Run API tests                |
| `npm run lint`         | ESLint                       |

## Environment variables

See `.env.example`. Never commit `.env`.

## API overview

### Public

| Method | Path                 | Description                                                             |
| ------ | -------------------- | ----------------------------------------------------------------------- |
| GET    | `/health`            | Health + DB check                                                       |
| POST   | `/auth/admin/login`  | Admin login → JWT                                                       |
| GET    | `/matches`           | List matches (`date`, `league`, `market`, `search`, `published`)        |
| GET    | `/matches/:id`       | Match detail                                                            |
| GET    | `/predictions`       | List predictions (filters: `type`, `publish_status`, `approval_status`) |
| GET    | `/predictions/:id`   | Prediction detail                                                       |
| GET    | `/news`              | Published news only                                                     |
| GET    | `/news/:id`          | Article detail                                                          |
| GET    | `/analytics/signals` | Signal history (`period`: `today`, `7d`, `30d`; `league`)               |

### Admin (Bearer JWT)

| Method | Path                           | Description                                                  |
| ------ | ------------------------------ | ------------------------------------------------------------ |
| POST   | `/matches/sync`                | Import from API-Football (`date`, `league`)                  |
| POST   | `/matches/demo`                | Insert demo match (dev/no API key)                           |
| PATCH  | `/matches/:id/publish`         | Publish/unpublish match                                      |
| POST   | `/predictions`                 | Create manual prediction (`publish_status`: draft/published) |
| PATCH  | `/predictions/:id`             | Edit prediction                                              |
| POST   | `/predictions/:id/publish`     | Publish draft                                                |
| POST   | `/predictions/:id/archive`     | Archive prediction                                           |
| PATCH  | `/predictions/:id/result`      | Set win/loss                                                 |
| POST   | `/news`                        | Create article                                               |
| PATCH  | `/news/:id`                    | Update article                                               |
| DELETE | `/news/:id`                    | Delete article                                               |
| GET    | `/news/admin/all`              | All articles (incl. drafts)                                  |
| GET    | `/admin/stats`                 | Dashboard KPIs                                               |
| GET    | `/admin/export/predictions`    | CSV export                                                   |
| GET    | `/admin/export/signal-history` | CSV export                                                   |
| GET    | `/admin/api-health`            | API-Football config + usage                                  |

Default admin (from seed): `admin@predictpro.local` / value of `ADMIN_PASSWORD` in `.env`.

## WebSocket (Socket.IO) — Section 2

Connect to `ws://localhost:3001` (path `/socket.io`).

### Handshake auth

```js
const socket = io('http://localhost:3001', {
  auth: { role: 'premium' }, // free | premium | admin (or JWT token for admin)
});
```

### Client events

| Event         | Payload        | Description                           |
| ------------- | -------------- | ------------------------------------- |
| `join:match`  | `{ matchId }`  | Subscribe to live updates for a match |
| `leave:match` | `{ matchId }`  | Unsubscribe                           |
| `join:league` | `{ leagueId }` | Subscribe to standings updates        |

### Server events

| Event            | Who receives       | Description                               |
| ---------------- | ------------------ | ----------------------------------------- |
| `live:score`     | All clients        | Score, minute, status, logos              |
| `live:standings` | League subscribers | Standings table                           |
| `live:odds`      | **Premium only**   | Live odds (free users never receive this) |

### Odds behavior

- **Free users:** REST returns `odds_display` (= frozen `odds_snapshot` at publish time)
- **Premium users:** Same REST snapshot + live `live:odds` events over WebSocket

### Live poller

- Polls API-Football every `LIVE_POLL_INTERVAL_MS` (default 30s) when `API_FOOTBALL_KEY` is set
- Without API key: `LIVE_DEMO_MODE=true` simulates updates on the demo match (`POST /matches/demo`)

## Section status

- **Sections 0–7:** Complete ✅

## API error format

All error responses use a consistent shape:

```json
{ "error": "Human-readable message", "code": "BAD_REQUEST" }
```

Codes include `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

## Automated scanner (Section 4)

Runs after each live poll cycle (`src/scanner/service.js`):

| Rule         | Condition                                           |
| ------------ | --------------------------------------------------- |
| **Surprise** | Home team odds > 4.00                               |
| **Comeback** | Home losing by exactly 1 goal AND match status `HT` |

Flagged signals → `approval_status=pending`, `publish_status=draft` — visible only in Admin Approval Queue.

Demo mode triggers Surprise at minute 20 (odds 4.5) and Comeback at minute 45 (0–1 at HT).

## FCM push notifications (Section 4)

```bash
# Production: set path to Firebase service account JSON
FCM_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
FCM_ENABLED=true
```

Without Firebase creds, pushes run in **mock mode** (logged to console; used in tests).

### Register device token (mobile app)

```http
POST /notifications/register
{ "email": "premium@user.com", "token": "<fcm-token>", "platform": "android" }
```

On admin **Approve** in the queue → push sent to all **premium** users only, if notifications toggle is on in Settings.
