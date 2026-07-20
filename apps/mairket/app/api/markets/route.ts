import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/market-service";

export const revalidate = 60;

export async function GET() {
  const data = await getMarketData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
