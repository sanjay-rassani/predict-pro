# Predict Pro — Admin Dashboard

Next.js + Tailwind admin web app for managing matches, predictions, news, and signal approvals.

## Prerequisites

- Node.js 20+
- Backend API running at `http://localhost:3001`

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev    # http://localhost:3000
```

Ensure `NEXT_PUBLIC_API_URL=http://localhost:3001` in `.env.local`.

Default login (from backend seed): `admin@predictpro.local` / `admin123`

## Pages

| Route | Description |
|---|---|
| `/login` | Admin sign-in |
| `/dashboard` | Stats cards (matches, predictions, signals, premium users) |
| `/dashboard/matches` | Matches table, filters, search, manual prediction modal |
| `/dashboard/drafts` | Draft & published predictions, publish/archive |
| `/dashboard/approval` | Pending automated signals — approve/reject |
| `/dashboard/news` | Create, edit, delete, publish news |
| `/dashboard/settings` | API health, notification toggle, CSV export |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```

## Section status

- **Section 3:** Full admin UI wired to backend ✅
- **Section 4:** Automated scanner + FCM (next)
