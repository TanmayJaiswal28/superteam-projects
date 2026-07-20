import Link from "next/link";
import { Activity, ArrowRight, BrainCircuit, ChartNoAxesCombined, Check, Code2, DatabaseZap, Gauge, Layers3, LockKeyhole, Radar, ShieldCheck, Sparkles, WalletCards, Zap } from "lucide-react";
import { LiveSignalRibbon } from "./live-signal-ribbon";

export function LandingPage() {
  return <main className="landing">
    <div className="landing-noise" />
    <nav className="landing-nav">
      <Link className="landing-brand" href="/"><span className="brand-cube"><BrainCircuit size={21} /></span><strong>ARket</strong><i>BETA</i></Link>
      <div className="landing-links"><a href="#platform">Platform</a><a href="#how">How it works</a><a href="#developers">Developers</a></div>
      <Link className="nav-launch" href="/app">Launch app <ArrowRight size={15} /></Link>
    </nav>

    <section className="landing-hero">
      <div className="hero-copy">
        <div className="hero-kicker"><span><i /> LIVE ON SOLANA</span> Intelligence for markets that never sleep</div>
        <h1>See the market<br /><em>before it moves.</em></h1>
        <p>ARket turns live on-chain and market data into explainable forecasts, risk signals, and wallet intelligence—built for Solana DeFi.</p>
        <div className="hero-actions"><Link className="hero-primary" href="/app"><Sparkles size={17} /> Explore live signals <ArrowRight size={16} /></Link><a className="hero-secondary" href="#how"><span className="play-dot">▶</span> See how it works</a></div>
        <div className="hero-proof"><span><Check size={14} /> No account required</span><span><Check size={14} /> Non-custodial</span><span><Check size={14} /> Transparent model</span></div>
      </div>
      <div className="hero-visual" aria-label="Animated ARket prediction engine visualization">
        <div className="stage-glow" /><div className="orbit orbit-one"><i /><i /><i /></div><div className="orbit orbit-two"><i /><i /></div>
        <div className="arket-core"><span className="core-grid" /><BrainCircuit size={54} /><strong>AR</strong><small>PREDICTION CORE</small></div>
        <div className="float-card card-signal"><span>24H SIGNAL</span><strong>↗ STRONG BUY</strong><small>84% confidence</small></div>
        <div className="float-card card-price"><span>SOLANA MARKETS</span><strong>LIVE FEED</strong><small>Refreshes every 60s</small></div>
        <div className="float-card card-risk"><Gauge size={18} /><span>RISK</span><strong>32</strong><small>/ 100</small></div>
      </div>
    </section>

    <LiveSignalRibbon />

    <section className="landing-section" id="platform">
      <div className="section-heading"><span>THE ARKET EDGE</span><h2>Clarity for every<br />market decision.</h2><p>One intelligence layer for discovering signals, understanding risk, and tracking what matters.</p></div>
      <div className="feature-bento">
        <article className="feature-large"><div className="feature-icon purple"><BrainCircuit /></div><span>EXPLAINABLE FORECASTS</span><h3>Predictions you can inspect,<br />not just trust.</h3><p>Every forecast exposes its momentum, volatility, structure, and confidence factors.</p><div className="mini-model"><div><span>Momentum</span><i><b style={{width:"86%"}} /></i><strong>Positive</strong></div><div><span>Structure</span><i><b style={{width:"72%"}} /></i><strong>Accumulating</strong></div><div><span>Volatility</span><i><b style={{width:"48%"}} /></i><strong>Stable</strong></div></div></article>
        <article><div className="feature-icon green"><WalletCards /></div><span>WALLET INTELLIGENCE</span><h3>Your portfolio, in context.</h3><p>Connect Phantom, Solflare, or Backpack and inspect positions without giving up custody.</p><div className="wallet-stack"><i>P</i><i>S</i><i>B</i><small>READ-ONLY</small></div></article>
        <article><div className="feature-icon orange"><Radar /></div><span>ALWAYS-ON ALERTS</span><h3>Markets move. ARket watches.</h3><p>Persistent, wallet-scoped price conditions rechecked against every live refresh.</p><div className="alert-preview"><Zap size={15} /><span><b>SOL above $190</b><small>Armed · checking now</small></span><i /></div></article>
        <article className="feature-wide"><div><div className="feature-icon blue"><ChartNoAxesCombined /></div><span>MARKET PULSE</span><h3>From raw volatility to a clear signal.</h3><p>Live price feeds become forecasts, confidence, and risk measures in one focused workspace.</p></div><div className="pulse-visual"><span>MARKET PULSE</span><strong>Bullish</strong><div className="pulse-line"><i /><i /><i /><i /><i /><i /><i /><i /></div><small>4 of 6 assets trend positive</small></div></article>
      </div>
    </section>

    <section className="how-section" id="how"><div className="section-heading centered"><span>HOW ARKET WORKS</span><h2>Signal, without the noise.</h2><p>A transparent pipeline built around fresh data and explainable outputs.</p></div><div className="how-flow">
      <article><b>01</b><div><DatabaseZap /></div><h3>Ingest</h3><p>Live market and Solana RPC data enter the intelligence layer.</p></article><ArrowRight className="flow-arrow" />
      <article><b>02</b><div><Layers3 /></div><h3>Analyze</h3><p>Momentum is adjusted for volatility and market structure.</p></article><ArrowRight className="flow-arrow" />
      <article><b>03</b><div><Activity /></div><h3>Forecast</h3><p>ARket produces direction and calibrated confidence.</p></article><ArrowRight className="flow-arrow" />
      <article><b>04</b><div><ShieldCheck /></div><h3>Act responsibly</h3><p>Explore, track, and monitor from one workspace.</p></article>
    </div></section>

    <section className="developer-section" id="developers"><div><span>BUILT TO COMPOSE</span><h2>Intelligence for users.<br />APIs for builders.</h2><p>Use the same market, prediction, portfolio, and monitoring endpoints that power ARket’s workspace.</p><Link href="/app" className="text-link">Open developer docs <ArrowRight size={15} /></Link></div><div className="code-window"><header><i /><i /><i /><span>GET /api/predictions/SOL</span></header><pre><code>{JSON.stringify({symbol:"SOL",signal:"Strong buy",forecastChange:3.84,confidence:84,horizon:"24h"}, null, 2)}</code></pre><span className="api-live"><i /> LIVE RESPONSE</span></div></section>
    <section className="final-cta"><div className="cta-orb" /><LockKeyhole size={26} /><h2>Move through DeFi<br />with more context.</h2><p>Connect a wallet or explore ARket anonymously. Your keys never leave your wallet.</p><Link href="/app">Launch ARket <ArrowRight size={17} /></Link></section>
    <footer className="landing-footer"><Link className="landing-brand" href="/"><span className="brand-cube"><BrainCircuit size={18} /></span><strong>ARket</strong></Link><p>Explainable intelligence for Solana DeFi.</p><div><a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub"><Code2 size={18} /></a><span>Experimental signals · Not financial advice</span></div></footer>
  </main>;
}
