"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  BrainCircuit,
  Check,
  Copy,
  Database,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AlertRule, MarketAsset, PortfolioResponse, PredictionSnapshot } from "@/lib/types";

export type WorkspaceView = "signals" | "markets" | "watchlist" | "portfolio" | "alerts" | "settings" | "docs";

type ProductViewsProps = {
  view: WorkspaceView;
  assets: MarketAsset[];
  favorites: string[];
  selectedSymbol: string;
  wallet: string;
  ownerId: string;
  refreshInterval: number;
  onSelect: (symbol: string) => void;
  onFavorite: (symbol: string) => void;
  onConnectWallet: () => void;
  onNotify: (message: string) => void;
  onAlertCount: (count: number) => void;
  onRefreshInterval: (seconds: number) => void;
};

const money = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: value < 0.01 ? 8 : value < 1 ? 4 : 2,
}).format(value);

const compact = (value: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);

function Direction({ value }: { value: number }) {
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={value >= 0 ? "positive-text" : "negative-text"}><Icon size={13} /> {value >= 0 ? "+" : ""}{value.toFixed(2)}%</span>;
}

function Mark({ asset }: { asset: Pick<MarketAsset, "symbol" | "color" | "logoUrl"> }) {
  return <span className="asset-mark has-logo small" style={{ "--asset-color": asset.color, "--asset-logo": `url("${asset.logoUrl}")` } as React.CSSProperties}><span className="asset-letter">{asset.symbol[0]}</span></span>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="view-empty"><Database size={28} /><strong>{title}</strong><span>{body}</span></div>;
}

function SignalsView({ assets, selectedSymbol, onSelect }: Pick<ProductViewsProps, "assets" | "selectedSymbol" | "onSelect">) {
  const selected = assets.find((asset) => asset.symbol === selectedSymbol) ?? assets[0];
  const [history, setHistory] = useState<PredictionSnapshot[]>([]);

  useEffect(() => {
    if (!selected) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/predictions/${selected.symbol}/history?limit=12`);
        const result = await response.json() as { snapshots: PredictionSnapshot[] };
        setHistory(result.snapshots);
      } catch {
        setHistory([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selected]);

  return (
    <div className="workspace-stack">
      <section className="signal-card-grid">
        {assets.map((asset) => (
          <button key={asset.symbol} className={`panel asset-signal-card ${asset.symbol === selected?.symbol ? "selected" : ""}`} onClick={() => onSelect(asset.symbol)}>
            <div className="asset-signal-top"><Mark asset={asset} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span><span className={`signal-pill ${asset.signal.toLowerCase().replace(" ", "-")}`}>{asset.signal}</span></div>
            <div className="signal-price"><strong>{money(asset.price)}</strong><Direction value={asset.change24h} /></div>
            <div className="signal-forecast"><span>24h forecast</span><strong>{money(asset.forecastPrice)}</strong><Direction value={asset.forecastChange} /></div>
            <div className="confidence-cell"><i><b style={{ width: `${asset.confidence}%` }} /></i><strong>{asset.confidence}% confidence</strong></div>
          </button>
        ))}
      </section>
      <section className="panel history-panel">
        <div className="workspace-heading"><div><span className="panel-label"><BrainCircuit size={15} /> PREDICTION AUDIT TRAIL</span><h2>{selected?.name ?? "Asset"} forecast history</h2><p>Five-minute snapshots persisted by the ARket API.</p></div><span className="api-status"><i /> DATABASE ONLINE</span></div>
        {history.length ? (
          <div className="history-list">
            {history.map((item) => <div key={item.createdAt}><span>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><strong>{money(item.currentPrice)}</strong><span>→ {money(item.forecastPrice)}</span><Direction value={item.forecastChange} /><span>{item.confidence}%</span><span className={`signal-pill ${item.signal.toLowerCase().replace(" ", "-")}`}>{item.signal}</span></div>)}
          </div>
        ) : <Empty title="First snapshot recorded" body="Refresh market data to build a longer auditable prediction history." />}
      </section>
    </div>
  );
}

function MarketsView({ assets, favorites, watchlistOnly, onSelect, onFavorite }: Pick<ProductViewsProps, "assets" | "favorites" | "onSelect" | "onFavorite"> & { watchlistOnly: boolean }) {
  const visible = watchlistOnly ? assets.filter((asset) => favorites.includes(asset.symbol)) : assets;
  return (
    <section className="panel workspace-panel">
      <div className="workspace-heading"><div><span className="panel-label"><Activity size={15} /> {watchlistOnly ? "PERSISTENT WATCHLIST" : "LIVE MARKET DIRECTORY"}</span><h2>{watchlistOnly ? "Your monitored assets" : "Solana ecosystem markets"}</h2><p>Server-backed preferences and live model output.</p></div><span className="api-status"><i /> COINGECKO LIVE</span></div>
      {visible.length ? <div className="market-card-list">{visible.map((asset) => (
        <div className="market-card-row" key={asset.symbol}>
          <button className="market-asset-button" onClick={() => onSelect(asset.symbol)}><Mark asset={asset} /><span><strong>{asset.name}</strong><small>{asset.symbol}</small></span></button>
          <div><small>Price</small><strong>{money(asset.price)}</strong></div>
          <div><small>24h change</small><Direction value={asset.change24h} /></div>
          <div><small>Market cap</small><strong>${compact(asset.marketCap)}</strong></div>
          <div><small>AI forecast</small><strong>{money(asset.forecastPrice)}</strong><Direction value={asset.forecastChange} /></div>
          <div><small>Confidence</small><strong>{asset.confidence}%</strong></div>
          <span className={`signal-pill ${asset.signal.toLowerCase().replace(" ", "-")}`}>{asset.signal}</span>
          <button className={`favorite-button ${favorites.includes(asset.symbol) ? "active" : ""}`} onClick={() => onFavorite(asset.symbol)} aria-label="Toggle watchlist"><Star size={17} fill={favorites.includes(asset.symbol) ? "currentColor" : "none"} /></button>
        </div>
      ))}</div> : <Empty title="Your watchlist is empty" body="Open Markets and star assets to monitor them here." />}
    </section>
  );
}

function PortfolioView({ assets, wallet, onConnectWallet, onNotify }: Pick<ProductViewsProps, "assets" | "wallet" | "onConnectWallet" | "onNotify">) {
  const [address, setAddress] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inspect = async (walletAddress = address) => {
    const normalized = walletAddress.trim();
    if (!normalized) { setError("Enter or connect a Solana wallet address"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(normalized)}`);
      const result = await response.json() as PortfolioResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Portfolio lookup failed");
      setPortfolio(result);
      setAddress(normalized);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Portfolio lookup failed");
      setPortfolio(null);
    } finally { setLoading(false); }
  };

  const copyAddress = async () => {
    if (!portfolio) return;
    await navigator.clipboard.writeText(portfolio.address);
    onNotify("Wallet address copied");
  };

  return (
    <div className="workspace-stack">
      <section className="panel portfolio-connect-panel">
        <div className="workspace-heading"><div><span className="panel-label"><WalletCards size={15} /> READ-ONLY SOLANA PORTFOLIO</span><h2>Inspect any public wallet</h2><p>Balances come directly from Solana mainnet RPC. ARket never requests signing access.</p></div><span className="api-status"><i /> SOLANA RPC</span></div>
        <div className="wallet-lookup"><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Paste a Solana wallet address" aria-label="Solana wallet address" /><button onClick={() => void inspect()} disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <Activity size={16} />} Analyze portfolio</button></div>
        <div className="wallet-shortcuts"><button onClick={onConnectWallet}><WalletCards size={15} /> {wallet ? "Reconnect Phantom" : "Connect Phantom"}</button>{wallet && <button onClick={() => { setAddress(wallet); void inspect(wallet); }}><Check size={15} /> Use {wallet.slice(0, 5)}...{wallet.slice(-5)}</button>}</div>
        {error && <div className="inline-error"><XCircle size={16} /> {error}</div>}
      </section>
      {portfolio && <>
        {portfolio.warning && <div className="rpc-warning"><ShieldCheck size={16} /> {portfolio.warning}</div>}
        <section className="portfolio-metrics">
          <article className="panel"><span>Tracked value</span><strong>{money(portfolio.totalValue)}</strong><small>Live marked-to-market</small></article>
          <article className="panel"><span>SOL balance</span><strong>{portfolio.solBalance.toLocaleString(undefined, { maximumFractionDigits: 5 })}</strong><small>{money(portfolio.solBalance * (assets.find((asset) => asset.symbol === "SOL")?.price ?? 0))}</small></article>
          <article className="panel"><span>Tracked tokens</span><strong>{portfolio.trackedTokenAccounts}</strong><small>{portfolio.untrackedTokenAccounts} other SPL accounts · {portfolio.rpcProvider}</small></article>
        </section>
        <section className="panel workspace-panel">
          <div className="workspace-heading"><div><span className="panel-label">PORTFOLIO HOLDINGS</span><h2>Current positions</h2></div><button className="copy-wallet" onClick={() => void copyAddress()}><Copy size={14} /> {portfolio.address.slice(0, 7)}...{portfolio.address.slice(-7)}</button></div>
          {portfolio.holdings.length ? <div className="holding-list">{portfolio.holdings.map((holding) => <div key={holding.symbol}><span className="asset-mark has-logo small" style={{ "--asset-color": holding.color, "--asset-logo": `url("${holding.logoUrl}")` } as React.CSSProperties}><span className="asset-letter">{holding.symbol[0]}</span></span><span><strong>{holding.name}</strong><small>{holding.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {holding.symbol}</small></span><span><small>Price</small><strong>{money(holding.price)}</strong></span><Direction value={holding.change24h} /><strong>{money(holding.value)}</strong></div>)}</div> : <Empty title="No tracked holdings found" body="The wallet may contain other SPL tokens that are not yet in the ARket universe." />}
        </section>
      </>}
    </div>
  );
}

function AlertsView({ assets, ownerId, onAlertCount, onNotify }: Pick<ProductViewsProps, "assets" | "ownerId" | "onAlertCount" | "onNotify">) {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [symbol, setSymbol] = useState("SOL");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`/api/alerts?owner=${encodeURIComponent(ownerId)}`, { cache: "no-store" });
      const result = await response.json() as { alerts: AlertRule[] };
      setAlerts(result.alerts);
      onAlertCount(result.alerts.filter((alert) => alert.active).length);
    } finally { setLoading(false); }
  }, [onAlertCount, ownerId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadAlerts(), 0);
    const timer = window.setInterval(() => void loadAlerts(), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [loadAlerts]);

  const create = async () => {
    const price = Number(target);
    if (!Number.isFinite(price) || price <= 0) { onNotify("Enter a valid positive target price"); return; }
    const response = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, direction, targetPrice: price, owner: ownerId }) });
    if (!response.ok) { onNotify("Unable to create alert"); return; }
    setTarget(""); onNotify(`${symbol} price alert created`); await loadAlerts();
  };

  const toggle = async (alert: AlertRule) => {
    await fetch(`/api/alerts/${alert.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !alert.active, owner: ownerId }) });
    await loadAlerts();
  };

  const remove = async (alert: AlertRule) => {
    await fetch(`/api/alerts/${alert.id}?owner=${encodeURIComponent(ownerId)}`, { method: "DELETE" });
    onNotify(`${alert.symbol} alert deleted`); await loadAlerts();
  };

  const currentAsset = assets.find((asset) => asset.symbol === symbol);
  return (
    <div className="alerts-layout">
      <section className="panel alert-form-panel">
        <span className="panel-label"><Plus size={15} /> CREATE PRICE ALERT</span><h2>New market condition</h2><p>Rules are stored by the backend and evaluated against each live refresh.</p>
        <label>Asset<select value={symbol} onChange={(event) => { setSymbol(event.target.value); setTarget(""); }}>{assets.map((asset) => <option key={asset.symbol}>{asset.symbol}</option>)}</select></label>
        <label>Condition<select value={direction} onChange={(event) => setDirection(event.target.value as "above" | "below")}><option value="above">Price moves above</option><option value="below">Price moves below</option></select></label>
        <label>Target price<div className="target-input"><span>$</span><input type="number" min="0" step="any" value={target} onChange={(event) => setTarget(event.target.value)} placeholder={currentAsset ? String(currentAsset.price) : "0.00"} /></div></label>
        <button className="primary-action" onClick={() => void create()}><BellRing size={16} /> Create alert</button>
      </section>
      <section className="panel alerts-list-panel">
        <div className="workspace-heading"><div><span className="panel-label"><BellRing size={15} /> ACTIVE MONITOR</span><h2>Price alerts</h2><p>Automatically rechecked every 60 seconds.</p></div><button className="refresh-mini" onClick={() => void loadAlerts()}><RefreshCw size={15} /></button></div>
        {loading ? <div className="view-empty"><LoaderCircle className="spin" size={26} /><span>Loading alerts</span></div> : alerts.length ? <div className="alerts-list">{alerts.map((alert) => <div className={alert.triggered ? "triggered" : ""} key={alert.id}><span className="alert-symbol">{alert.symbol}</span><span><strong>{alert.direction === "above" ? "Above" : "Below"} {money(alert.targetPrice)}</strong><small>Current {alert.currentPrice === null ? "—" : money(alert.currentPrice)}</small></span><span className={`alert-status ${alert.triggered ? "hit" : alert.active ? "armed" : "paused"}`}>{alert.triggered ? "Triggered" : alert.active ? "Armed" : "Paused"}</span><button onClick={() => void toggle(alert)}>{alert.active ? "Pause" : "Resume"}</button><button className="delete-alert" onClick={() => void remove(alert)} aria-label="Delete alert"><Trash2 size={15} /></button></div>)}</div> : <Empty title="No alerts created" body="Create a price condition to start monitoring the market." />}
      </section>
    </div>
  );
}

function SettingsView({ onNotify, refreshInterval, onRefreshInterval }: Pick<ProductViewsProps, "onNotify" | "refreshInterval" | "onRefreshInterval">) {
  const [currency, setCurrency] = useState("USD");
  const [refresh, setRefresh] = useState(String(refreshInterval));
  const [risk, setRisk] = useState("balanced");
  const save = () => {
    localStorage.setItem("arket-settings", JSON.stringify({ currency, refresh, risk }));
    onRefreshInterval(Number(refresh));
    onNotify("Dashboard preferences saved");
  };
  return <section className="panel settings-panel"><div className="workspace-heading"><div><span className="panel-label"><ShieldCheck size={15} /> PRODUCT SETTINGS</span><h2>Dashboard preferences</h2><p>Local display settings. Prediction calculations remain server controlled.</p></div></div><div className="settings-grid"><label>Display currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD</option></select></label><label>Refresh interval<select value={refresh} onChange={(event) => setRefresh(event.target.value)}><option value="30">30 seconds</option><option value="60">60 seconds</option><option value="300">5 minutes</option></select></label><label>Risk profile<select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="conservative">Conservative</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></select></label></div><button className="primary-action settings-save" onClick={save}><Save size={16} /> Save preferences</button></section>;
}

function DocsView() {
  const endpoints = [
    ["GET", "/api/markets", "Live market data and forecasts"],
    ["GET", "/api/predictions/SOL", "Current asset prediction"],
    ["GET", "/api/predictions/SOL/history", "Persisted prediction snapshots"],
    ["GET · PUT · DELETE", "/api/watchlist", "Persistent watchlist CRUD"],
    ["GET · POST", "/api/alerts", "Alert evaluation and creation"],
    ["GET", "/api/portfolio/:address", "Read-only Solana wallet portfolio"],
  ];
  return <div className="workspace-stack"><section className="panel docs-hero"><BookOpen size={29} /><div><span className="panel-label">ARKET API v0.3</span><h2>Developer documentation</h2><p>Server routes return JSON and are available from the same origin. No API key is required for local development.</p></div></section><section className="panel endpoint-list">{endpoints.map(([method, path, description]) => <div key={path}><span>{method}</span><code>{path}</code><p>{description}</p><a href={path.includes(":address") ? "https://solana.com/docs/rpc/http/gettokenaccountsbyowner" : path} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a></div>)}</section><section className="panel docs-note"><Sparkles size={18} /><div><strong>Prediction methodology</strong><p>The current model is a transparent momentum ensemble using multi-horizon returns, short/long EMA divergence, annualized volatility damping, and directional confidence. It does not claim to be a trained neural network. Replace the service boundary with a trained model before representing it as one.</p></div></section></div>;
}

export function ProductView(props: ProductViewsProps) {
  const view = props.view;
  if (view === "signals") return <SignalsView assets={props.assets} selectedSymbol={props.selectedSymbol} onSelect={props.onSelect} />;
  if (view === "markets" || view === "watchlist") return <MarketsView assets={props.assets} favorites={props.favorites} watchlistOnly={view === "watchlist"} onSelect={props.onSelect} onFavorite={props.onFavorite} />;
  if (view === "portfolio") return <PortfolioView assets={props.assets} wallet={props.wallet} onConnectWallet={props.onConnectWallet} onNotify={props.onNotify} />;
  if (view === "alerts") return <AlertsView assets={props.assets} ownerId={props.ownerId} onAlertCount={props.onAlertCount} onNotify={props.onNotify} />;
  if (view === "settings") return <SettingsView onNotify={props.onNotify} refreshInterval={props.refreshInterval} onRefreshInterval={props.onRefreshInterval} />;
  return <DocsView />;
}
