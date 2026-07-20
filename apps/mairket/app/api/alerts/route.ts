import { NextResponse } from "next/server";
import { createAlert, listAlerts, markTriggeredAlerts } from "@/lib/database";
import { getMarketData, SUPPORTED_SYMBOLS } from "@/lib/market-service";

function owner(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9:_-]{3,96}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const workspace = owner(new URL(request.url).searchParams.get("owner"));
  if (!workspace) return NextResponse.json({ error: "Valid owner is required" }, { status: 400 });
  const market = await getMarketData();
  const prices = new Map(market.assets.map((asset) => [asset.symbol, asset.price]));
  let alerts = listAlerts(workspace, prices);
  markTriggeredAlerts(alerts);
  alerts = listAlerts(workspace, prices);
  return NextResponse.json({ alerts, updatedAt: market.updatedAt });
}

export async function POST(request: Request) {
  const body = await request.json() as { symbol?: unknown; direction?: unknown; targetPrice?: unknown; owner?: unknown };
  const workspace = owner(body.owner);
  if (!workspace) return NextResponse.json({ error: "Valid owner is required" }, { status: 400 });
  const symbol = typeof body.symbol === "string" ? body.symbol.toUpperCase() : "";
  const targetPrice = Number(body.targetPrice);
  if (!SUPPORTED_SYMBOLS.includes(symbol as (typeof SUPPORTED_SYMBOLS)[number])) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  if (body.direction !== "above" && body.direction !== "below") return NextResponse.json({ error: "Direction must be above or below" }, { status: 400 });
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return NextResponse.json({ error: "Target price must be positive" }, { status: 400 });
  const id = createAlert(workspace, { symbol, direction: body.direction, targetPrice });
  return NextResponse.json({ id }, { status: 201 });
}
