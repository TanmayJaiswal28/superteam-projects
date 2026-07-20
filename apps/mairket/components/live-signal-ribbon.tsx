"use client";

import { useEffect, useState } from "react";
import type { MarketResponse } from "@/lib/types";

const fallback = [
  { symbol: "SOL", price: 0, change24h: 0, signal: "Loading" },
  { symbol: "JUP", price: 0, change24h: 0, signal: "Loading" },
  { symbol: "PYTH", price: 0, change24h: 0, signal: "Loading" },
];

const price = (value: number) => value ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 1 ? 4 : 2 }).format(value) : "—";

export function LiveSignalRibbon() {
  const [signals, setSignals] = useState(fallback);
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/markets");
        if (!response.ok) return;
        const data = await response.json() as MarketResponse;
        setSignals(data.assets.filter((asset) => ["SOL", "JUP", "PYTH"].includes(asset.symbol)).map((asset) => ({ symbol: asset.symbol, price: asset.price, change24h: asset.change24h, signal: asset.signal })));
      } catch { /* The loading state keeps the landing page resilient. */ }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="signal-ribbon" aria-label="Live market signals"><div className="ribbon-title"><i /> LIVE INTELLIGENCE</div>{signals.map(item => <div className="ribbon-token" key={item.symbol}><b>{item.symbol}</b><span>{price(item.price)}</span><em className={item.change24h >= 0 ? "up" : ""}>{item.price ? `${item.change24h >= 0 ? "+" : ""}${item.change24h.toFixed(2)}%` : "—"}</em><small>{item.signal}</small></div>)}<span className="ribbon-update">Updates every 60s</span></section>;
}
