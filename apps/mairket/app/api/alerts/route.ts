import { NextResponse } from "next/server";
import { createAlert, listAlerts, markTriggeredAlerts } from "@/lib/database";
import { getMarketData, SUPPORTED_SYMBOLS } from "@/lib/market-service";

export async function GET() {
  const market = await getMarketData();
  const prices = new Map(market.assets.map((asset) => [asset.symbol, asset.price]));
  let alerts = listAlerts(prices);
  markTriggeredAlerts(alerts);
  alerts = listAlerts(prices);
  return NextResponse.json({ alerts, updatedAt: market.updatedAt });
}

export async function POST(request: Request) {
  const body = await request.json() as { symbol?: unknown; direction?: unknown; targetPrice?: unknown };
  const symbol = typeof body.symbol === "string" ? body.symbol.toUpperCase() : "";
  const targetPrice = Number(body.targetPrice);
  if (!SUPPORTED_SYMBOLS.includes(symbol as (typeof SUPPORTED_SYMBOLS)[number])) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  if (body.direction !== "above" && body.direction !== "below") return NextResponse.json({ error: "Direction must be above or below" }, { status: 400 });
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return NextResponse.json({ error: "Target price must be positive" }, { status: 400 });
  const id = createAlert({ symbol, direction: body.direction, targetPrice });
  return NextResponse.json({ id }, { status: 201 });
}
