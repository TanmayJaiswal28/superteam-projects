import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/portfolio-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ address: string }> }) {
  const { address } = await context.params;
  try {
    return NextResponse.json(await getPortfolio(address));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portfolio lookup failed";
    const status = message.includes("valid Solana") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
