import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ARket — Predict DeFi before it moves", template: "%s | ARket" },
  description: "Live Solana market intelligence, explainable AI forecasts, wallet portfolios, watchlists, and price alerts.",
  applicationName: "ARket",
  keywords: ["Solana", "DeFi", "market predictions", "AI", "crypto analytics"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${geistMono.variable}`}>{children}</body></html>;
}
