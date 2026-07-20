import { buildHistory, forecastMarket, summarizeMarket } from "./prediction-engine";
import type { CoinGeckoAsset, MarketAsset, MarketResponse } from "./types";

const TRACKED_ASSETS = [
  { id: "solana", mint: null, symbol: "SOL", name: "Solana", color: "#8b5cf6", price: 176.42, change24h: 4.82 },
  { id: "jupiter-exchange-solana", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "Jupiter", color: "#22d3a7", price: 0.876, change24h: 2.61 },
  { id: "bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6HKbTgDbnY5fQV", symbol: "BONK", name: "Bonk", color: "#f59e0b", price: 0.00002143, change24h: -1.26 },
  { id: "raydium", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", symbol: "RAY", name: "Raydium", color: "#38bdf8", price: 2.91, change24h: 6.34 },
  { id: "pyth-network", mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", symbol: "PYTH", name: "Pyth Network", color: "#ef7cf2", price: 0.174, change24h: -0.54 },
  { id: "chainlink", mint: null, symbol: "LINK", name: "Chainlink", color: "#4f7cff", price: 18.76, change24h: 1.91 },
] as const;

export const SUPPORTED_SYMBOLS = TRACKED_ASSETS.map((asset) => asset.symbol);

function seededHistory(base: number, seed: number) {
  return Array.from({ length: 168 }, (_, index) => {
    const drift = (index / 168) * (seed % 2 ? 0.052 : -0.018);
    const wave = Math.sin((index + seed) / 8) * 0.021 + Math.sin((index + seed) / 23) * 0.014;
    return base * (1 - 0.032 + drift + wave);
  });
}

function toMarketAsset(raw: CoinGeckoAsset, fallback: (typeof TRACKED_ASSETS)[number], index: number): MarketAsset {
  const prices = raw.sparkline_in_7d?.price?.filter((price) => Number.isFinite(price)) ?? seededHistory(raw.current_price, index + 1);
  const prediction = forecastMarket({
    price: raw.current_price,
    prices,
    change1h: raw.price_change_percentage_1h_in_currency ?? 0,
    change24h: raw.price_change_percentage_24h_in_currency ?? 0,
    change7d: raw.price_change_percentage_7d_in_currency ?? 0,
  });
  return {
    id: raw.id,
    mint: fallback.mint,
    symbol: fallback.symbol,
    name: fallback.name,
    color: fallback.color,
    price: raw.current_price,
    change1h: raw.price_change_percentage_1h_in_currency ?? 0,
    change24h: raw.price_change_percentage_24h_in_currency ?? 0,
    change7d: raw.price_change_percentage_7d_in_currency ?? 0,
    marketCap: raw.market_cap,
    volume24h: raw.total_volume,
    ...prediction,
    history: buildHistory(prices, raw.current_price),
  };
}

function fallbackAssets(): MarketAsset[] {
  return TRACKED_ASSETS.map((asset, index) => {
    const prices = seededHistory(asset.price, index + 1);
    const change1h = Math.sin(index + 1) * 0.7;
    const change7d = ((prices.at(-1) ?? asset.price) / prices[0] - 1) * 100;
    const prediction = forecastMarket({ price: asset.price, prices, change1h, change24h: asset.change24h, change7d });
    return {
      ...asset,
      change1h,
      change7d,
      marketCap: asset.price * (280_000_000 + index * 910_000_000),
      volume24h: asset.price * (14_000_000 + index * 8_000_000),
      ...prediction,
      history: buildHistory(prices, asset.price),
    };
  });
}

export async function getMarketData(): Promise<MarketResponse> {
  const ids = TRACKED_ASSETS.map((asset) => asset.id).join(",");
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h%2C24h%2C7d`,
      { next: { revalidate: 60 }, headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error(`Market provider returned ${response.status}`);
    const records = (await response.json()) as CoinGeckoAsset[];
    const byId = new Map(records.map((record) => [record.id, record]));
    const assets = TRACKED_ASSETS.map((fallback, index) => {
      const record = byId.get(fallback.id);
      if (!record) return fallbackAssets()[index];
      return toMarketAsset(record, fallback, index);
    });
    return { assets, source: "live", updatedAt: new Date().toISOString(), marketPulse: summarizeMarket(assets) };
  } catch {
    const assets = fallbackAssets();
    return { assets, source: "fallback", updatedAt: new Date().toISOString(), marketPulse: summarizeMarket(assets) };
  }
}
