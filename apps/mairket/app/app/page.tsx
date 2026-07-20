import type { Metadata } from "next";
import { MarketDashboard } from "@/components/market-dashboard";

export const metadata: Metadata = { title: "Market Workspace", description: "The ARket live Solana intelligence workspace." };

export default function AppPage() {
  return <MarketDashboard />;
}
