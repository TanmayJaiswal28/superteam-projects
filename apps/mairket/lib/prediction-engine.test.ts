import { describe, expect, it } from "vitest";
import { calculateVolatility, exponentialMovingAverage, forecastMarket } from "./prediction-engine";

describe("prediction engine", () => {
  it("calculates a stable EMA", () => {
    expect(exponentialMovingAverage([10, 11, 12, 13], 3)).toBeCloseTo(12.125, 3);
  });

  it("returns zero volatility for a flat series", () => {
    expect(calculateVolatility([10, 10, 10, 10])).toBe(0);
  });

  it("bounds forecasts and confidence", () => {
    const result = forecastMarket({
      price: 100,
      prices: Array.from({ length: 120 }, (_, index) => 75 + index * 0.25),
      change1h: 4,
      change24h: 40,
      change7d: 70,
    });
    expect(result.forecastChange).toBeLessThanOrEqual(18);
    expect(result.confidence).toBeGreaterThanOrEqual(54);
    expect(result.confidence).toBeLessThanOrEqual(94);
  });
});
