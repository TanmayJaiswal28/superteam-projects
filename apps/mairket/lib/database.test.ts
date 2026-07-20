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
    expect(store.listWatchlist()).toContain("SOL");
    expect(store.addToWatchlist("BONK")).toContain("BONK");
    expect(store.removeFromWatchlist("BONK")).not.toContain("BONK");
  });

  it("creates, evaluates, pauses, and deletes alerts", () => {
    const id = store.createAlert({ symbol: "SOL", direction: "above", targetPrice: 100 });
    const triggered = store.listAlerts(new Map([["SOL", 125]])).find((alert) => alert.id === id);
    expect(triggered?.triggered).toBe(true);
    expect(store.updateAlert(id, false)).toBe(true);
    expect(store.listAlerts(new Map([["SOL", 125]])).find((alert) => alert.id === id)?.active).toBe(false);
    expect(store.deleteAlert(id)).toBe(true);
  });
});
