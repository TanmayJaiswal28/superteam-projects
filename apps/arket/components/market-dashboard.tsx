"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Command,
  ExternalLink,
  Eye,
  Gauge,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketAsset, MarketResponse } from "@/lib/types";
import { ProductView, type WorkspaceView } from "./product-views";

type WalletProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect?: () => Promise<void>;
};

declare global {
  interface Window {
    solana?: WalletProvider;
    phantom?: { solana?: WalletProvider };
    solflare?: WalletProvider;
    backpack?: { solana?: WalletProvider };
  }
}

const WALLET_OPTIONS = [
  { id: "phantom", name: "Phantom", initial: "P", url: "https://phantom.com/download" },
  { id: "solflare", name: "Solflare", initial: "S", url: "https://solflare.com" },
  { id: "backpack", name: "Backpack", initial: "B", url: "https://backpack.app" },
] as const;

const FALLBACK_SYMBOLS = ["SOL", "JUP", "BONK", "RAY", "PYTH", "LINK"];

function formatCurrency(value: number, compact = false) {
  if (value < 0.01) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 8 }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`change ${positive ? "positive" : "negative"}`}>
      <Icon size={13} strokeWidth={2.5} /> {positive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function AssetMark({ asset, small = false }: { asset: Pick<MarketAsset, "symbol" | "color" | "logoUrl">; small?: boolean }) {
  return (
    <span className={`asset-mark has-logo ${small ? "small" : ""}`} style={{ "--asset-color": asset.color, "--asset-logo": `url("${asset.logoUrl}")` } as React.CSSProperties}>
      <span className="asset-letter">{asset.symbol.slice(0, 1)}</span>
    </span>
  );
}

function TokenSkeleton() {
  return (
    <div className="token-row skeleton-row" aria-hidden="true">
      <span className="skeleton circle" />
      <span className="skeleton line wide" />
      <span className="skeleton line" />
      <span className="skeleton line" />
      <span className="skeleton pill" />
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const price = payload.find((item) => item.dataKey === "forecast")?.value ?? payload.find((item) => item.dataKey === "price")?.value;
  return (
    <div className="chart-tooltip">
      <span>{label ? new Date(label).toLocaleString("en-US", { weekday: "short", hour: "numeric" }) : ""}</span>
      <strong>{price !== undefined ? formatCurrency(price) : "—"}</strong>
    </div>
  );
}

export function MarketDashboard() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("SOL");
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState("7D");
  const [favorites, setFavorites] = useState<string[]>(["SOL", "JUP", "RAY"]);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [wallet, setWallet] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletModal, setWalletModal] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState("");
  const [ownerId, setOwnerId] = useState("anonymous");
  const [notice, setNotice] = useState("");
  const [activeView, setActiveView] = useState<"overview" | WorkspaceView>("overview");
  const [alertCount, setAlertCount] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(60);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("arket-session-id");
      const session = saved ?? `anon_${crypto.randomUUID()}`;
      if (!saved) window.localStorage.setItem("arket-session-id", session);
      setOwnerId(session);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadMarkets = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch("/api/markets", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to reach the prediction service");
      const result = (await response.json()) as MarketResponse;
      setData(result);
      setError("");
      if (manual) setNotice("Market intelligence refreshed");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Market data unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadMarkets(), 0);
    const marketTimer = window.setInterval(() => void loadMarkets(), refreshInterval * 1_000);
    const favoritesTimer = window.setTimeout(async () => {
      const savedSettings = window.localStorage.getItem("arket-settings") ?? window.localStorage.getItem("mairket-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as { refresh?: string };
          const savedRefresh = Number(parsed.refresh);
          if ([30, 60, 300].includes(savedRefresh)) setRefreshInterval(savedRefresh);
        } catch {
          // Keep safe defaults when local settings are malformed.
        }
      }
      try {
        const response = await fetch(`/api/watchlist?owner=${encodeURIComponent(ownerId)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Watchlist unavailable");
        const result = await response.json() as { symbols: string[] };
        setFavorites(result.symbols);
        window.localStorage.setItem(`arket-watchlist:${ownerId}`, JSON.stringify(result.symbols));
      } catch {
        const stored = window.localStorage.getItem(`arket-watchlist:${ownerId}`);
        if (stored) setFavorites(JSON.parse(stored) as string[]);
      }
    }, 0);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(marketTimer);
      window.clearTimeout(favoritesTimer);
    };
  }, [loadMarkets, refreshInterval, ownerId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const assets = useMemo(() => data?.assets ?? [], [data]);
  const selected = assets.find((asset) => asset.symbol === selectedSymbol) ?? assets[0];
  const filteredAssets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesQuery = !search || asset.name.toLowerCase().includes(search) || asset.symbol.toLowerCase().includes(search);
      const matchesWatchlist = !watchlistOnly || favorites.includes(asset.symbol);
      return matchesQuery && matchesWatchlist;
    });
  }, [assets, favorites, query, watchlistOnly]);

  const chartData = useMemo(() => {
    if (!selected) return [];
    const history = selected.history;
    const horizon = timeframe === "24H" ? 12 : timeframe === "7D" ? 48 : history.length;
    return history.slice(-horizon);
  }, [selected, timeframe]);

  const toggleFavorite = async (symbol: string) => {
    const removing = favorites.includes(symbol);
    const previous = favorites;
    const next = removing ? favorites.filter((item) => item !== symbol) : [...favorites, symbol];
    setFavorites(next);
    window.localStorage.setItem(`arket-watchlist:${ownerId}`, JSON.stringify(next));
    try {
      const response = await fetch(removing ? `/api/watchlist?symbol=${encodeURIComponent(symbol)}&owner=${encodeURIComponent(ownerId)}` : "/api/watchlist", {
        method: removing ? "DELETE" : "PUT",
        headers: removing ? undefined : { "Content-Type": "application/json" },
        body: removing ? undefined : JSON.stringify({ symbol, owner: ownerId }),
      });
      if (!response.ok) throw new Error("Watchlist update failed");
      const result = await response.json() as { symbols: string[] };
      setFavorites(result.symbols);
      setNotice(removing ? `${symbol} removed from watchlist` : `${symbol} added to watchlist`);
    } catch {
      setFavorites(previous);
      setNotice("Watchlist update failed");
    }
  };

  const changeView = (view: "overview" | WorkspaceView) => {
    setActiveView(view);
    setMenuOpen(false);
  };

  const updateAlertCount = useCallback((count: number) => setAlertCount(count), []);

  const viewCopy: Record<"overview" | WorkspaceView, { eyebrow: string; title: string; accent: string; description: string }> = {
    overview: { eyebrow: "SOLANA MARKET INTELLIGENCE", title: "Good morning,", accent: "market explorer.", description: "AI-assisted signals that turn DeFi volatility into clear, explainable market context." },
    signals: { eyebrow: "EXPLAINABLE PREDICTIONS", title: "Understand every", accent: "market signal.", description: "Inspect forecasts, confidence, model factors, and the persisted prediction audit trail." },
    markets: { eyebrow: "LIVE MARKET DIRECTORY", title: "Track the", accent: "Solana ecosystem.", description: "Real-time prices and volatility-adjusted forecasts for supported assets." },
    watchlist: { eyebrow: "PERSISTENT WATCHLIST", title: "Focus on", accent: "your markets.", description: "Your monitored assets are stored by the backend and available across reloads." },
    portfolio: { eyebrow: "ON-CHAIN PORTFOLIO", title: "Read your", accent: "Solana positions.", description: "Inspect public wallet balances using live mainnet RPC without requesting signing access." },
    alerts: { eyebrow: "AUTOMATED MONITORING", title: "Act on", accent: "market conditions.", description: "Create persistent price rules evaluated against every live market refresh." },
    settings: { eyebrow: "PRODUCT CONTROL", title: "Configure your", accent: "workspace.", description: "Manage dashboard preferences and risk presentation." },
    docs: { eyebrow: "DEVELOPER PLATFORM", title: "Build with", accent: "ARket APIs.", description: "Use the market, prediction, portfolio, watchlist, and alert endpoints directly." },
  };
  const currentView = viewCopy[activeView];

  const walletProvider = (id: string): WalletProvider | undefined => {
    if (id === "phantom") return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined);
    if (id === "solflare") return window.solflare;
    if (id === "backpack") return window.backpack?.solana;
  };

  const connectWallet = async (id?: string) => {
    if (wallet) {
      await walletProvider(walletName.toLowerCase())?.disconnect?.().catch(() => undefined);
      setWallet("");
      setWalletName("");
      setOwnerId(window.localStorage.getItem("arket-session-id") ?? "anonymous");
      setNotice("Wallet disconnected");
      return;
    }
    if (!id) { setWalletModal(true); return; }
    const option = WALLET_OPTIONS.find((item) => item.id === id);
    const provider = walletProvider(id);
    if (!provider) { window.open(option?.url, "_blank", "noopener,noreferrer"); setNotice(`${option?.name ?? "Wallet"} is not installed`); return; }
    setWalletConnecting(id);
    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWallet(address);
      setWalletName(option?.name ?? id);
      setOwnerId(address);
      setWalletModal(false);
      setNotice(`${option?.name ?? "Wallet"} connected`);
    } catch {
      setNotice("Wallet connection was cancelled");
    } finally { setWalletConnecting(""); }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><BrainCircuit size={23} /></div>
          <div><strong><span>AR</span>ket</strong><small>DeFi intelligence</small></div>
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={19} /></button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <p>Workspace</p>
          <button className={`nav-item ${activeView === "overview" ? "active" : ""}`} onClick={() => changeView("overview")}><LayoutDashboard size={18} /> Overview</button>
          <button className={`nav-item ${activeView === "signals" ? "active" : ""}`} onClick={() => changeView("signals")}><Sparkles size={18} /> AI Signals <span className="nav-count">{assets.filter((asset) => asset.signal !== "Hold").length}</span></button>
          <button className={`nav-item ${activeView === "markets" ? "active" : ""}`} onClick={() => changeView("markets")}><BarChart3 size={18} /> Markets</button>
          <button className={`nav-item ${activeView === "watchlist" ? "active" : ""}`} onClick={() => changeView("watchlist")}><Eye size={18} /> Watchlist <span className="nav-count">{favorites.length}</span></button>
          <p>Account</p>
          <button className={`nav-item ${activeView === "portfolio" ? "active" : ""}`} onClick={() => changeView("portfolio")}><WalletCards size={18} /> Portfolio</button>
          <button className={`nav-item ${activeView === "alerts" ? "active" : ""}`} onClick={() => changeView("alerts")}><Bell size={18} /> Alerts {alertCount > 0 ? <span className="nav-count">{alertCount}</span> : <span className="notification-dot" />}</button>
        </nav>

        <div className="model-card">
          <div className="model-icon"><Bot size={20} /></div>
          <div><span>Prediction engine</span><strong>Momentum ensemble v0.2</strong></div>
          <div className="live-line"><i /> Operational</div>
        </div>

        <div className="sidebar-footer">
          <button className={`nav-item ${activeView === "settings" ? "active" : ""}`} onClick={() => changeView("settings")}><Settings size={18} /> Settings</button>
          <button className={`nav-item ${activeView === "docs" ? "active" : ""}`} onClick={() => changeView("docs")}><CircleHelp size={18} /> Documentation</button>
          <p>Experimental signals · Not financial advice</p>
        </div>
      </aside>

      {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div className="brand-mark compact"><BrainCircuit size={19} /></div>
            <strong>ARket</strong>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets or symbols" aria-label="Search assets" />
            <kbd><Command size={12} /> K</kbd>
          </div>
          <div className="top-actions">
            <div className="network"><i /> Solana Mainnet <ChevronDown size={14} /></div>
            <button className="icon-button" aria-label="Notifications" onClick={() => changeView("alerts")}><Bell size={18} /><span className="button-dot" /></button>
            <button className={`wallet-button ${wallet ? "connected" : ""}`} onClick={() => void connectWallet()}>
              <WalletCards size={16} /> {wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Connect wallet"}
            </button>
          </div>
        </header>

        <div className="dashboard">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="live-badge"><i /> LIVE</span> {currentView.eyebrow}</div>
              <h1>{currentView.title} <span>{currentView.accent}</span></h1>
              <p>{currentView.description}</p>
            </div>
            <button className="refresh-button" onClick={() => void loadMarkets(true)} disabled={refreshing}>
              <RefreshCw className={refreshing ? "spin" : ""} size={16} /> Refresh data
            </button>
          </section>

          {activeView === "overview" ? <>
          {error && (
            <div className="error-banner" role="alert">
              <span><Activity size={18} /> {error}</span>
              <button onClick={() => void loadMarkets()}>Try again</button>
            </div>
          )}

          <section className="metric-grid" aria-label="Market overview">
            <article className="metric-card accent-purple">
              <div className="metric-heading"><span><Gauge size={16} /> Market pulse</span><small>24H</small></div>
              <div className="metric-value">{data?.marketPulse.sentiment ?? "Loading"}<span className="pulse-orb" /></div>
              <p>{data ? `${assets.filter((item) => item.forecastChange > 0).length} of ${assets.length} tracked assets trend positive` : "Reading market structure"}</p>
              <div className="micro-bars">{[4, 6, 5, 8, 7, 10, 8, 11, 13, 12, 15, 17].map((height, index) => <i key={index} style={{ height }} />)}</div>
            </article>
            <article className="metric-card accent-green">
              <div className="metric-heading"><span><BrainCircuit size={16} /> Model confidence</span><small>ENSEMBLE</small></div>
              <div className="metric-value">{data?.marketPulse.confidence ?? "—"}<sup>%</sup></div>
              <p><span className="positive-text">High conviction</span> across current signals</p>
              <div className="confidence-track"><i style={{ width: `${data?.marketPulse.confidence ?? 0}%` }} /></div>
            </article>
            <article className="metric-card accent-orange">
              <div className="metric-heading"><span><ShieldCheck size={16} /> Market risk</span><small>REAL-TIME</small></div>
              <div className="metric-value">{(data?.marketPulse.riskScore ?? 0) < 45 ? "Moderate" : "Elevated"}<span className="risk-score">{data?.marketPulse.riskScore ?? "—"}/100</span></div>
              <p>Volatility-adjusted risk across tracked liquidity</p>
              <div className="risk-track"><i style={{ width: `${data?.marketPulse.riskScore ?? 0}%` }} /></div>
            </article>
            <article className="metric-card accent-blue">
              <div className="metric-heading"><span><Zap size={16} /> Active signals</span><small>NOW</small></div>
              <div className="metric-value">{assets.filter((item) => item.signal !== "Hold").length || "—"}<sup>/ {assets.length || 6}</sup></div>
              <p><span className="positive-text">{assets.filter((item) => item.signal.includes("buy")).length} buy</span> · {assets.filter((item) => item.signal === "Sell").length} sell · updated 60s</p>
              <div className="signal-dots">{FALLBACK_SYMBOLS.map((symbol, index) => <i key={symbol} className={assets[index]?.signal === "Sell" ? "sell" : ""} />)}</div>
            </article>
          </section>

          <section className="content-grid">
            <article className="panel forecast-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-label"><Activity size={15} /> FEATURED FORECAST</span>
                  {selected ? (
                    <div className="asset-title"><AssetMark asset={selected} /><div><h2>{selected.name} <span>{selected.symbol}/USD</span></h2><p>{formatCurrency(selected.price)} <Change value={selected.change24h} /></p></div></div>
                  ) : <div className="skeleton title-skeleton" />}
                </div>
                <div className="timeframe-tabs" aria-label="Chart timeframe">
                  {["24H", "7D", "30D"].map((item) => <button key={item} className={timeframe === item ? "active" : ""} onClick={() => setTimeframe(item)}>{item}</button>)}
                </div>
              </div>

              <div className="chart-wrap" aria-label={`${selected?.name ?? "Market"} price and forecast chart`}>
                {selected ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#ffffff0b" />
                      <XAxis dataKey="time" tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: "short" })} axisLine={false} tickLine={false} tick={{ fill: "#6f7080", fontSize: 11 }} minTickGap={32} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(value) => `$${Number(value).toFixed(selected.price < 1 ? 3 : 0)}`} axisLine={false} tickLine={false} tick={{ fill: "#6f7080", fontSize: 11 }} width={54} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#8b5cf6", strokeDasharray: "4 4" }} />
                      <Area type="monotone" dataKey="price" stroke="#9b75ff" strokeWidth={2.3} fill="url(#priceFill)" connectNulls />
                      <Area type="monotone" dataKey="forecast" stroke="#42e8ba" strokeWidth={2.3} strokeDasharray="6 5" fill="transparent" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="chart-skeleton skeleton" />}
                <div className="chart-legend"><span><i className="actual" /> Actual</span><span><i className="projected" /> AI projection</span></div>
              </div>

              <div className="forecast-summary">
                <div><span>24H FORECAST</span><strong>{selected ? formatCurrency(selected.forecastPrice) : "—"}</strong><Change value={selected?.forecastChange ?? 0} /></div>
                <div><span>CONFIDENCE</span><strong>{selected?.confidence ?? "—"}%</strong><small>{(selected?.confidence ?? 0) > 75 ? "High" : "Moderate"}</small></div>
                <div><span>VOLATILITY</span><strong>{selected?.volatility ?? "—"}%</strong><small>Annualized</small></div>
                <div><span>MODEL SIGNAL</span><strong className={`signal-text ${selected?.signal === "Sell" ? "negative-text" : ""}`}><Sparkles size={15} /> {selected?.signal ?? "—"}</strong><small>24h horizon</small></div>
              </div>
            </article>

            <aside className="panel intelligence-panel">
              <div className="panel-title-row"><div><span className="panel-label"><BrainCircuit size={15} /> AI INTELLIGENCE</span><h2>Signal breakdown</h2></div><span className="ai-chip"><i /> ONLINE</span></div>
              <div className="signal-hero"><span>ARket signal</span><strong className={selected?.signal === "Sell" ? "negative-text" : ""}>{selected?.signal ?? "Analyzing"}</strong><p>for {selected?.symbol ?? "the selected asset"} over the next 24 hours</p></div>
              <div className="factor-list">
                <div><span><i className="factor-icon positive-bg"><ArrowUpRight size={14} /></i>Price momentum</span><strong className={(selected?.change24h ?? 0) >= 0 ? "positive-text" : "negative-text"}>{(selected?.change24h ?? 0) >= 0 ? "Positive" : "Negative"}</strong></div>
                <div><span><i className="factor-icon purple-bg"><Activity size={14} /></i>Volatility regime</span><strong>{(selected?.volatility ?? 0) > 60 ? "Elevated" : "Stable"}</strong></div>
                <div><span><i className="factor-icon blue-bg"><BarChart3 size={14} /></i>Market structure</span><strong>{(selected?.change7d ?? 0) >= 0 ? "Accumulating" : "Consolidating"}</strong></div>
                <div><span><i className="factor-icon orange-bg"><ShieldCheck size={14} /></i>Risk profile</span><strong>{(selected?.volatility ?? 0) > 75 ? "Aggressive" : "Balanced"}</strong></div>
              </div>
              <div className="thesis-box"><div><Sparkles size={16} /><strong>Model thesis</strong></div><p>{selected ? `${selected.symbol} shows ${selected.forecastChange >= 0 ? "constructive" : "defensive"} momentum. The signal is dampened for ${selected.volatility > 60 ? "elevated" : "contained"} volatility, producing a ${selected.confidence}% confidence estimate.` : "The model is building a market thesis."}</p></div>
              <button className="details-button" onClick={() => changeView("signals")}><span>View full prediction details</span><ExternalLink size={15} /></button>
            </aside>
          </section>

          <section className="panel market-panel">
            <div className="market-header">
              <div><span className="panel-label"><BarChart3 size={15} /> MARKET WATCH</span><h2>Solana ecosystem</h2><p>Live prices with AI-assisted 24-hour forecasts</p></div>
              <div className="market-controls">
                <button className={watchlistOnly ? "active" : ""} onClick={() => setWatchlistOnly((value) => !value)}><Star size={15} fill={watchlistOnly ? "currentColor" : "none"} /> Watchlist</button>
                <span className={`data-source ${data?.source === "fallback" ? "fallback" : ""}`}><i /> {data?.source === "fallback" ? "Resilient demo feed" : "Live provider"}</span>
              </div>
            </div>
            <div className="market-table" role="table" aria-label="Solana ecosystem forecasts">
              <div className="table-head" role="row"><span>Asset</span><span>Price</span><span>24h</span><span>Market cap</span><span>24h forecast</span><span>Confidence</span><span>Signal</span><span /></div>
              {loading ? <><TokenSkeleton /><TokenSkeleton /><TokenSkeleton /><TokenSkeleton /></> : filteredAssets.length ? filteredAssets.map((asset) => (
                <button className={`token-row ${selected?.symbol === asset.symbol ? "selected" : ""}`} key={asset.symbol} onClick={() => setSelectedSymbol(asset.symbol)} role="row">
                  <span className="asset-cell"><AssetMark asset={asset} small /><span><strong>{asset.name}</strong><small>{asset.symbol}</small></span></span>
                  <strong className="price-cell">{formatCurrency(asset.price)}</strong>
                  <Change value={asset.change24h} />
                  <span className="muted-cell">${formatCompact(asset.marketCap)}</span>
                  <span className="forecast-cell"><strong>{formatCurrency(asset.forecastPrice)}</strong><small className={asset.forecastChange >= 0 ? "positive-text" : "negative-text"}>{asset.forecastChange >= 0 ? "+" : ""}{asset.forecastChange.toFixed(2)}%</small></span>
                  <span className="confidence-cell"><i><b style={{ width: `${asset.confidence}%` }} /></i><strong>{asset.confidence}%</strong></span>
                  <span className={`signal-pill ${asset.signal.toLowerCase().replace(" ", "-")}`}>{asset.signal}</span>
                  <span className="star-cell" onClick={(event) => { event.stopPropagation(); toggleFavorite(asset.symbol); }} role="button" aria-label={`${favorites.includes(asset.symbol) ? "Remove" : "Add"} ${asset.symbol} ${favorites.includes(asset.symbol) ? "from" : "to"} watchlist`}><Star size={16} fill={favorites.includes(asset.symbol) ? "currentColor" : "none"} /></span>
                </button>
              )) : <div className="empty-state"><Search size={24} /><strong>No assets found</strong><span>Try a different search or clear the watchlist filter.</span></div>}
            </div>
          </section>
          </> : <ProductView view={activeView} assets={assets} favorites={favorites} selectedSymbol={selectedSymbol} wallet={wallet} ownerId={ownerId} refreshInterval={refreshInterval} onSelect={setSelectedSymbol} onFavorite={(symbol) => void toggleFavorite(symbol)} onConnectWallet={() => void connectWallet()} onNotify={setNotice} onAlertCount={updateAlertCount} onRefreshInterval={setRefreshInterval} />}

          <footer className="dashboard-footer">
            <span><ShieldCheck size={14} /> Experimental research signals · Never financial advice</span>
            <span>Updated {data ? new Date(data.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"} · Prices via CoinGecko</span>
          </footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><Sparkles size={16} /> {notice}</div>}
      {walletModal && <div className="wallet-modal-backdrop" onMouseDown={() => setWalletModal(false)}><section className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}><button className="wallet-close" onClick={() => setWalletModal(false)} aria-label="Close wallet selector"><X size={18} /></button><div className="wallet-modal-icon"><WalletCards size={24} /></div><span>ENTER ARKET</span><h2 id="wallet-title">Connect a Solana wallet</h2><p>Choose your wallet to unlock a persistent, wallet-scoped workspace. ARket never requests your seed phrase or takes custody.</p><div className="wallet-options">{WALLET_OPTIONS.map((option) => { const detected = Boolean(walletProvider(option.id)); return <button key={option.id} onClick={() => void connectWallet(option.id)} disabled={Boolean(walletConnecting)}><i>{option.initial}</i><span><strong>{option.name}</strong><small>{detected ? "Detected in browser" : "Install wallet"}</small></span>{walletConnecting === option.id ? <RefreshCw className="spin" size={17} /> : <ArrowUpRight size={17} />}</button>; })}</div><div className="wallet-safety"><ShieldCheck size={15} /> Connection is non-custodial and read-only until you approve an action.</div></section></div>}
    </div>
  );
}
