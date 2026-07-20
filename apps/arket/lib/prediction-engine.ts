import type { MarketAsset, PricePoint, Signal } from "./types";

const round = (value: number, places = 2) => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 3) return 0;
  const returns = prices.slice(1).map((price, index) => Math.log(price / prices[index]));
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(365 * 24) * 100, 1);
}

export function exponentialMovingAverage(values: number[], period: number): number {
  if (!values.length) return 0;
  const alpha = 2 / (period + 1);
  return values.slice(1).reduce((ema, value) => value * alpha + ema * (1 - alpha), values[0]);
}

export function forecastMarket(input: {
  price: number;
  prices: number[];
  change1h: number;
  change24h: number;
  change7d: number;
}) {
  const { price, prices, change1h, change24h, change7d } = input;
  const short = exponentialMovingAverage(prices.slice(-48), 12);
  const long = exponentialMovingAverage(prices.slice(-120), 36);
  const emaMomentum = long ? ((short - long) / long) * 100 : 0;
  const blendedMomentum = change1h * 0.14 + change24h * 0.44 + change7d * 0.12 + emaMomentum * 0.3;
  const volatility = calculateVolatility(prices);
  const dampener = Math.max(0.36, 1 - volatility / 220);
  const forecastChange = Math.max(-18, Math.min(18, blendedMomentum * dampener));
  const directionalClarity = Math.min(18, Math.abs(emaMomentum) * 4 + Math.abs(change24h) * 0.7);
  const confidence = Math.round(Math.max(54, Math.min(94, 76 + directionalClarity - volatility * 0.12)));

  let signal: Signal = "Hold";
  if (forecastChange >= 4 && confidence >= 70) signal = "Strong buy";
  else if (forecastChange >= 1.25) signal = "Buy";
  else if (forecastChange <= -1.75) signal = "Sell";

  return {
    forecastPrice: round(price * (1 + forecastChange / 100), price < 1 ? 6 : 2),
    forecastChange: round(forecastChange, 2),
    confidence,
    volatility,
    signal,
  };
}

export function buildHistory(prices: number[], currentPrice: number): PricePoint[] {
  const bounded = prices.length ? prices.slice(-168) : [currentPrice];
  const sampled = bounded.filter((_, index) => index % 4 === 0 || index === bounded.length - 1);
  const now = Date.now();
  const points: PricePoint[] = sampled.map((price, index) => ({
    time: new Date(now - (sampled.length - index - 1) * 4 * 60 * 60 * 1000).toISOString(),
    price: round(price, price < 1 ? 6 : 2),
  }));
  const last = points.at(-1)?.price ?? currentPrice;
  const slope = points.length > 5 ? (last - points[points.length - 6].price) / 5 : 0;

  for (let step = 1; step <= 6; step += 1) {
    points.push({
      time: new Date(now + step * 4 * 60 * 60 * 1000).toISOString(),
      price: last,
      forecast: round(Math.max(0, last + slope * step * 0.72), currentPrice < 1 ? 6 : 2),
    });
  }

  return points;
}

export function summarizeMarket(assets: MarketAsset[]) {
  const averageForecast = assets.reduce((sum, asset) => sum + asset.forecastChange, 0) / assets.length;
  const riskScore = Math.round(Math.min(100, assets.reduce((sum, asset) => sum + asset.volatility, 0) / assets.length));
  const confidence = Math.round(assets.reduce((sum, asset) => sum + asset.confidence, 0) / assets.length);
  return {
    sentiment: averageForecast > 1.25 ? "Bullish" as const : averageForecast < -1.25 ? "Bearish" as const : "Neutral" as const,
    riskScore,
    confidence,
  };
}
