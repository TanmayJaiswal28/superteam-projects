# mAIrket

mAIrket is a full-stack intelligence dashboard for Solana DeFi markets. It combines live market and on-chain data with a transparent momentum ensemble to produce 24-hour directional forecasts, confidence scores, volatility estimates, portfolios, persistent alerts, and watchlist signals.

## Features

- Live SOL ecosystem pricing with resilient offline fallback data
- 24-hour forecast, signal, confidence, and annualized volatility metrics
- Interactive historical and projected price chart
- Server-persisted watchlists, price alerts, and forecast snapshots using SQLite
- Phantom-compatible connection plus read-only analysis of any public Solana wallet
- Live Solana RPC failover with graceful partial results under public-provider limits
- Public JSON endpoints for markets, predictions, history, portfolios, watchlists, and alerts
- Responsive, accessible interface with loading, empty, error, and fallback states

## Architecture

The MVP uses a transparent momentum ensemble rather than presenting simulated output as a trained neural network. It blends multi-horizon price changes with short/long exponential moving-average divergence, then applies a volatility dampener and directional confidence score. The service boundary is ready to be replaced by a trained model and decentralized oracle publisher.

## Run locally

From the monorepo root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app creates its local database at `apps/mairket/.data/mairket.sqlite`.

For complete SPL-token portfolio discovery in production, provide a dedicated Solana RPC endpoint:

```bash
SOLANA_RPC_URL=https://your-provider.example npm run dev
```

Public Solana endpoints are rate-limited. Without a dedicated endpoint, mAIrket still returns SOL balances and clearly marks token discovery as partial.

## API

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/markets` | GET | Live market data and prediction output |
| `/api/predictions/:symbol` | GET | Current asset forecast |
| `/api/predictions/:symbol/history` | GET | Persisted forecast snapshots |
| `/api/watchlist` | GET, PUT, DELETE | Watchlist persistence |
| `/api/alerts` | GET, POST | Alert evaluation and creation |
| `/api/alerts/:id` | PATCH, DELETE | Pause, resume, or delete an alert |
| `/api/portfolio/:address` | GET | Read-only Solana portfolio lookup |

## Disclaimer

Forecasts are experimental research signals and are not financial advice.
