import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const testDatabase = join(tmpdir(), `mairket-${process.pid}-${Date.now()}.sqlite`);
let store: typeof import("./database");

beforeAll(async () => {
  process.env.MAIRKET_DB_PATH = testDatabase;
  store = await import("./database");
});

afterAll(() => {
  store.closeDatabase();
  delete process.env.MAIRKET_DB_PATH;
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${testDatabase}${suffix}`;
    if (existsSync(file)) unlinkSync(file);
  }
});

describe("persistent product storage", () => {
  it("stores and removes watchlist assets", () => {
    expect(store.listWatchlist("test-user")).toContain("SOL");
    expect(store.addToWatchlist("test-user", "BONK")).toContain("BONK");
    expect(store.removeFromWatchlist("test-user", "BONK")).not.toContain("BONK");
  });

  it("keeps workspaces isolated and allows an empty watchlist", () => {
    expect(store.addToWatchlist("second-user", "BONK")).toContain("BONK");
    expect(store.listWatchlist("test-user")).not.toContain("BONK");
    for (const symbol of store.listWatchlist("empty-user")) store.removeFromWatchlist("empty-user", symbol);
    expect(store.listWatchlist("empty-user")).toEqual([]);
  });

  it("creates, evaluates, pauses, and deletes alerts", () => {
    const id = store.createAlert("test-user", { symbol: "SOL", direction: "above", targetPrice: 100 });
    const triggered = store.listAlerts("test-user", new Map([["SOL", 125]])).find((alert) => alert.id === id);
    expect(triggered?.triggered).toBe(true);
    expect(store.updateAlert("test-user", id, false)).toBe(true);
    expect(store.listAlerts("test-user", new Map([["SOL", 125]])).find((alert) => alert.id === id)?.active).toBe(false);
    expect(store.deleteAlert("test-user", id)).toBe(true);
    expect(store.listAlerts("second-user")).toEqual([]);
  });
});
