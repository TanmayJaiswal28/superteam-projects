import { NextResponse } from "next/server";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/database";
import { SUPPORTED_SYMBOLS } from "@/lib/market-service";

function validSymbol(value: unknown): value is string {
  return typeof value === "string" && SUPPORTED_SYMBOLS.includes(value.toUpperCase() as (typeof SUPPORTED_SYMBOLS)[number]);
}

export async function GET() {
  return NextResponse.json({ symbols: listWatchlist() });
}

export async function PUT(request: Request) {
  const body = await request.json() as { symbol?: unknown };
  if (!validSymbol(body.symbol)) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  return NextResponse.json({ symbols: addToWatchlist(body.symbol.toUpperCase()) });
}

export async function DELETE(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol");
  if (!validSymbol(symbol)) return NextResponse.json({ error: "Unsupported symbol" }, { status: 400 });
  return NextResponse.json({ symbols: removeFromWatchlist(symbol.toUpperCase()) });
}
