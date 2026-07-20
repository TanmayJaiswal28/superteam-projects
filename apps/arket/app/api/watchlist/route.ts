import { NextResponse } from "next/server";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/database";
import { SUPPORTED_SYMBOLS } from "@/lib/market-service";

function validSymbol(value: unknown): value is string {
  return typeof value === "string" && SUPPORTED_SYMBOLS.includes(value.toUpperCase() as (typeof SUPPORTED_SYMBOLS)[number]);
}

function owner(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9:_-]{3,96}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const workspace = owner(new URL(request.url).searchParams.get("owner"));
  if (!workspace) return NextResponse.json({ error: "Valid owner is required" }, { status: 400 });
  return NextResponse.json({ symbols: listWatchlist(workspace) });
}

export async function PUT(request: Request) {
  const body = await request.json() as { symbol?: unknown; owner?: unknown };
  const workspace = owner(body.owner);
  if (!workspace) return NextResponse.json({ error: "Valid owner is required" }, { status: 400 });
  if (!validSymbol(body.symbol)) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  return NextResponse.json({ symbols: addToWatchlist(workspace, body.symbol.toUpperCase()) });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const workspace = owner(url.searchParams.get("owner"));
  if (!workspace) return NextResponse.json({ error: "Valid owner is required" }, { status: 400 });
  if (!validSymbol(symbol)) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  return NextResponse.json({ symbols: removeFromWatchlist(workspace, symbol.toUpperCase()) });
}
