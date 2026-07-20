import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AlertRule, MarketAsset, PredictionSnapshot } from "./types";

type AlertRow = {
  id: string;
  symbol: string;
  direction: "above" | "below";
  target_price: number;
  active: number;
  created_at: string;
  last_triggered_at: string | null;
};

type PredictionRow = {
  symbol: string;
  current_price: number;
  forecast_price: number;
  forecast_change: number;
  confidence: number;
  signal: PredictionSnapshot["signal"];
  created_at: string;
};

let database: DatabaseSync | null = null;

function getDatabase() {
  if (database) return database;
  const file = process.env.MAIRKET_DB_PATH ?? join(process.cwd(), ".data", "mairket.sqlite");
  mkdirSync(dirname(file), { recursive: true });
  database = new DatabaseSync(file);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS watchlist (
      symbol TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('above', 'below')),
      target_price REAL NOT NULL CHECK(target_price > 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_triggered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS prediction_snapshots (
      symbol TEXT NOT NULL,
      bucket INTEGER NOT NULL,
      current_price REAL NOT NULL,
      forecast_price REAL NOT NULL,
      forecast_change REAL NOT NULL,
      confidence INTEGER NOT NULL,
      signal TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(symbol, bucket)
    );
  `);

  const count = database.prepare("SELECT COUNT(*) AS count FROM watchlist").get() as { count: number };
  if (count.count === 0) {
    const insert = database.prepare("INSERT OR IGNORE INTO watchlist(symbol) VALUES (?)");
    for (const symbol of ["SOL", "JUP", "RAY"]) insert.run(symbol);
  }
  return database;
}

export function listWatchlist(): string[] {
  return (getDatabase().prepare("SELECT symbol FROM watchlist ORDER BY created_at").all() as Array<{ symbol: string }>).map((row) => row.symbol);
}

export function addToWatchlist(symbol: string) {
  getDatabase().prepare("INSERT OR IGNORE INTO watchlist(symbol, created_at) VALUES (?, ?)").run(symbol, new Date().toISOString());
  return listWatchlist();
}

export function removeFromWatchlist(symbol: string) {
  getDatabase().prepare("DELETE FROM watchlist WHERE symbol = ?").run(symbol);
  return listWatchlist();
}

export function listAlerts(prices: Map<string, number> = new Map()): AlertRule[] {
  const rows = getDatabase().prepare("SELECT * FROM alerts ORDER BY created_at DESC").all() as AlertRow[];
  return rows.map((row) => {
    const currentPrice = prices.get(row.symbol) ?? null;
    const triggered = Boolean(row.active && currentPrice !== null && (row.direction === "above" ? currentPrice >= row.target_price : currentPrice <= row.target_price));
    return {
      id: row.id,
      symbol: row.symbol,
      direction: row.direction,
      targetPrice: row.target_price,
      active: Boolean(row.active),
      triggered,
      currentPrice,
      createdAt: row.created_at,
      lastTriggeredAt: row.last_triggered_at,
    };
  });
}

export function createAlert(input: { symbol: string; direction: "above" | "below"; targetPrice: number }) {
  const id = crypto.randomUUID();
  getDatabase().prepare("INSERT INTO alerts(id, symbol, direction, target_price, active, created_at) VALUES (?, ?, ?, ?, 1, ?)")
    .run(id, input.symbol, input.direction, input.targetPrice, new Date().toISOString());
  return id;
}

export function updateAlert(id: string, active: boolean) {
  return getDatabase().prepare("UPDATE alerts SET active = ? WHERE id = ?").run(active ? 1 : 0, id).changes > 0;
}

export function deleteAlert(id: string) {
  return getDatabase().prepare("DELETE FROM alerts WHERE id = ?").run(id).changes > 0;
}

export function markTriggeredAlerts(alerts: AlertRule[]) {
  const statement = getDatabase().prepare("UPDATE alerts SET last_triggered_at = ? WHERE id = ? AND last_triggered_at IS NULL");
  const now = new Date().toISOString();
  for (const alert of alerts) if (alert.triggered) statement.run(now, alert.id);
}

export function recordPredictions(assets: MarketAsset[]) {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / 300_000) * 300_000;
  const insert = getDatabase().prepare(`
    INSERT OR IGNORE INTO prediction_snapshots
      (symbol, bucket, current_price, forecast_price, forecast_change, confidence, signal, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const asset of assets) {
    insert.run(asset.symbol, bucket, asset.price, asset.forecastPrice, asset.forecastChange, asset.confidence, asset.signal, now.toISOString());
  }
}

export function getPredictionHistory(symbol: string, limit = 48): PredictionSnapshot[] {
  const rows = getDatabase().prepare(`
    SELECT symbol, current_price, forecast_price, forecast_change, confidence, signal, created_at
    FROM prediction_snapshots WHERE symbol = ? ORDER BY bucket DESC LIMIT ?
  `).all(symbol, Math.min(200, Math.max(1, limit))) as PredictionRow[];
  return rows.reverse().map((row) => ({
    symbol: row.symbol,
    currentPrice: row.current_price,
    forecastPrice: row.forecast_price,
    forecastChange: row.forecast_change,
    confidence: row.confidence,
    signal: row.signal,
    createdAt: row.created_at,
  }));
}

export function closeDatabase() {
  database?.close();
  database = null;
}
