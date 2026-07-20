import { NextResponse } from "next/server";
import { getPredictionHistory } from "@/lib/database";

export async function GET(request: Request, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 48);
  return NextResponse.json({ snapshots: getPredictionHistory(symbol.toUpperCase(), Number.isFinite(limit) ? limit : 48) });
}
