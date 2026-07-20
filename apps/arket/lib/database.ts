import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
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

const DEFAULT_WATCHLIST = ["SOL", "JUP", "RAY"];

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
  const defaultFile = process.env.VERCEL ? join(tmpdir(), "arket.sqlite") : join(process.cwd(), ".data", "arket.sqlite");
  const file = process.env.ARKET_DB_PATH ?? process.env.MAIRKET_DB_PATH ?? defaultFile;
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

    CREATE TABLE IF NOT EXISTS user_watchlist (
      owner TEXT NOT NULL,
      symbol TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(owner, symbol)
    );

    CREATE TABLE IF NOT EXISTS user_workspaces (
      owner TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_alerts (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('above', 'below')),
      target_price REAL NOT NULL CHECK(target_price > 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_triggered_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_user_alerts_owner ON user_alerts(owner, created_at);
  `);

  const count = database.prepare("SELECT COUNT(*) AS count FROM watchlist").get() as { count: number };
  if (count.count === 0) {
    const insert = database.prepare("INSERT OR IGNORE INTO watchlist(symbol) VALUES (?)");
    for (const symbol of ["SOL", "JUP", "RAY"]) insert.run(symbol);
  }
  return database;
}

function ensureWatchlist(owner: string) {
  const db = getDatabase();
  const created = db.prepare("INSERT OR IGNORE INTO user_workspaces(owner, created_at) VALUES (?, ?)").run(owner, new Date().toISOString());
  if (created.changes > 0) {
    const insert = db.prepare("INSERT OR IGNORE INTO user_watchlist(owner, symbol, created_at) VALUES (?, ?, ?)");
    const now = new Date().toISOString();
    for (const symbol of DEFAULT_WATCHLIST) insert.run(owner, symbol, now);
  }
}

export function listWatchlist(owner: string): string[] {
  ensureWatchlist(owner);
  return (getDatabase().prepare("SELECT symbol FROM user_watchlist WHERE owner = ? ORDER BY created_at").all(owner) as Array<{ symbol: string }>).map((row) => row.symbol);
}

export function addToWatchlist(owner: string, symbol: string) {
  ensureWatchlist(owner);
  getDatabase().prepare("INSERT OR IGNORE INTO user_watchlist(owner, symbol, created_at) VALUES (?, ?, ?)").run(owner, symbol, new Date().toISOString());
  return listWatchlist(owner);
}

export function removeFromWatchlist(owner: string, symbol: string) {
  getDatabase().prepare("DELETE FROM user_watchlist WHERE owner = ? AND symbol = ?").run(owner, symbol);
  return listWatchlist(owner);
}

export function listAlerts(owner: string, prices: Map<string, number> = new Map()): AlertRule[] {
  const rows = getDatabase().prepare("SELECT id, symbol, direction, target_price, active, created_at, last_triggered_at FROM user_alerts WHERE owner = ? ORDER BY created_at DESC").all(owner) as AlertRow[];
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

export function createAlert(owner: string, input: { symbol: string; direction: "above" | "below"; targetPrice: number }) {
  const id = crypto.randomUUID();
  getDatabase().prepare("INSERT INTO user_alerts(id, owner, symbol, direction, target_price, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
    .run(id, owner, input.symbol, input.direction, input.targetPrice, new Date().toISOString());
  return id;
}

export function updateAlert(owner: string, id: string, active: boolean) {
  return getDatabase().prepare("UPDATE user_alerts SET active = ? WHERE id = ? AND owner = ?").run(active ? 1 : 0, id, owner).changes > 0;
}

export function deleteAlert(owner: string, id: string) {
  return getDatabase().prepare("DELETE FROM user_alerts WHERE id = ? AND owner = ?").run(id, owner).changes > 0;
}

export function markTriggeredAlerts(alerts: AlertRule[]) {
  const statement = getDatabase().prepare("UPDATE user_alerts SET last_triggered_at = ? WHERE id = ? AND last_triggered_at IS NULL");
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
