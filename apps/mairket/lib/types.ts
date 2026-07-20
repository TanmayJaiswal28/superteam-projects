export type Signal = "Strong buy" | "Buy" | "Hold" | "Sell";

export interface PricePoint {
  time: string;
  price: number;
  forecast?: number;
}

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  color: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  forecastPrice: number;
  forecastChange: number;
  confidence: number;
  volatility: number;
  signal: Signal;
  history: PricePoint[];
}

export interface MarketResponse {
  assets: MarketAsset[];
  source: "live" | "fallback";
  updatedAt: string;
  marketPulse: {
    sentiment: "Bullish" | "Neutral" | "Bearish";
    riskScore: number;
    confidence: number;
  };
}

export interface CoinGeckoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}
