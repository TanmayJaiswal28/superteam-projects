# Superteam Projects

A monorepo for production-grade projects built from the Superteam ecosystem's open ideas.

## Projects

| Project | Description | Stack |
| --- | --- | --- |
| [ARket](./apps/mairket) | Publishable Solana DeFi forecasts, multi-wallet portfolios, scoped watchlists, alerts, and risk intelligence | Next.js, TypeScript, SQLite, Solana RPC, Recharts |

## Development

```bash
npm install
npm run dev
```

The development server starts at [http://localhost:3000](http://localhost:3000).

## Production

```bash
docker compose up --build
```

ARket ships as a standalone Node container with a persistent SQLite volume and a health check. Copy `.env.example` to `.env` and provide a dedicated `SOLANA_RPC_URL` for complete token portfolio discovery in production.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
