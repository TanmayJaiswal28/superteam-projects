# mAIrket

mAIrket is an AI-assisted intelligence dashboard for Solana DeFi markets. It combines live CoinGecko market data with a transparent momentum ensemble to produce 24-hour directional forecasts, confidence scores, volatility estimates, and actionable watchlist signals.

## Features

- Live SOL ecosystem pricing with resilient offline fallback data
- 24-hour forecast, signal, confidence, and annualized volatility metrics
- Interactive historical and projected price chart
- Searchable, sortable market table and persistent local watchlist
- Phantom-compatible wallet connection for wallet-aware product expansion
- Public JSON endpoints at `/api/markets` and `/api/predictions/:symbol`
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

## Disclaimer

Forecasts are experimental research signals and are not financial advice.
