import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/market-service";

export async function GET(_request: Request, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const data = await getMarketData();
  const asset = data.assets.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase());

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({
    symbol: asset.symbol,
    horizon: "24h",
    currentPrice: asset.price,
    forecastPrice: asset.forecastPrice,
    forecastChange: asset.forecastChange,
    confidence: asset.confidence,
    volatility: asset.volatility,
    signal: asset.signal,
    model: "mAIrket momentum ensemble v0.1",
    generatedAt: data.updatedAt,
    disclaimer: "Forecasts are experimental research signals, not financial advice.",
  });
}
