# ARket

ARket is a publishable Solana DeFi intelligence product. It combines live market data, a transparent momentum ensemble, public Solana RPC portfolio inspection, multi-wallet connection, wallet-scoped watchlists, price alerts, and persisted prediction history.

## Product surfaces

- Animated public landing page at `/`
- Live intelligence workspace at `/app`
- Phantom, Solflare, and Backpack browser-wallet connection
- Anonymous or wallet-scoped watchlists and alert rules
- Live market data with a resilient fallback feed
- Explainable 24-hour forecasts, volatility, confidence, and risk signals
- Read-only SOL and supported SPL portfolio inspection
- JSON APIs and `/api/health` deployment probe

Wallet connection is non-custodial. The application requests public-key access only and never asks for a seed phrase or private key.

## Local development

From the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run all gates with:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Environment

`SOLANA_RPC_URL` is optional locally and strongly recommended in production. Public RPC endpoints may block token-account discovery; ARket still returns the SOL balance and an explicit partial-data warning.

`ARKET_DB_PATH` selects the SQLite file. It defaults to `.data/arket.sqlite` from the app process working directory.

## Deployment

### Vercel

Import `TanmayJaiswal28/superteam-projects` and set the Root Directory to `apps/arket`, or use the one-click Vercel button in the repository README. Configure `SOLANA_RPC_URL` for complete portfolio discovery.

ARket uses `/tmp/arket.sqlite` when `VERCEL=1`. This makes all API routes deployable but the database is ephemeral across serverless cold starts. Use an external database for durable production alerts and watchlists.

### Docker

The root Dockerfile creates a non-root standalone Next.js image. Deploy it to Railway, Render, Fly.io, or any container host and attach persistent storage at `/app/apps/arket/.data`.

```bash
docker compose up --build
```

The compose definition exposes port 3000, persists ARket data, and includes container health monitoring.

## API routes

- `GET /api/markets`
- `GET /api/predictions/:symbol`
- `GET /api/predictions/:symbol/history`
- `GET|PUT|DELETE /api/watchlist` with an `owner`
- `GET|POST /api/alerts` with an `owner`
- `PATCH|DELETE /api/alerts/:id` with an `owner`
- `GET /api/portfolio/:address`
- `GET /api/health`

Forecasts are experimental research outputs, not financial advice.
