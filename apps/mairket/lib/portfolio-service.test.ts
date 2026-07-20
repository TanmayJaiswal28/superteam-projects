import { describe, expect, it } from "vitest";
import { isSolanaAddress } from "./portfolio-service";

describe("Solana portfolio validation", () => {
  it("accepts a base58 public key", () => {
    expect(isSolanaAddress("A1TMhSGzQxMr1TboBKtgixKz1sS6REASMxPo1qsyTSJd")).toBe(true);
  });

  it("rejects malformed and non-base58 input", () => {
    expect(isSolanaAddress("not-a-wallet")).toBe(false);
    expect(isSolanaAddress("O0Il11111111111111111111111111111111")).toBe(false);
  });
});
