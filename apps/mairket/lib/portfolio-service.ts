import { getMarketData } from "./market-service";
import type { PortfolioResponse } from "./types";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

type RpcResponse = {
  id: number;
  error?: { message: string };
  result?: { value: number | Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number | null } } } } } }> };
};

async function requestRpc(payload: unknown): Promise<{ results: RpcResponse[]; provider: string }> {
  const endpoints = [...new Set([
    process.env.SOLANA_RPC_URL,
    "https://solana-rpc.publicnode.com",
    "https://api.mainnet-beta.solana.com",
  ].filter((value): value is string => Boolean(value)))];
  let lastError = "No Solana RPC endpoint was available";
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(12_000) });
      if (!response.ok) { lastError = `${new URL(endpoint).hostname} returned ${response.status}`; continue; }
      const payloadResult = await response.json() as RpcResponse | RpcResponse[];
      const results = Array.isArray(payloadResult) ? payloadResult : [payloadResult];
      const rpcError = results.find((result) => result.error)?.error;
      if (rpcError) { lastError = rpcError.message; continue; }
      return { results, provider: new URL(endpoint).hostname };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "RPC request failed";
    }
  }
  throw new Error(lastError);
}

export function isSolanaAddress(address: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export async function getPortfolio(address: string): Promise<PortfolioResponse> {
  if (!isSolanaAddress(address)) throw new Error("Enter a valid Solana wallet address");
  const balancePayload = { jsonrpc: "2.0", id: 1, method: "getBalance", params: [address, { commitment: "confirmed" }] };
  const tokenPayload = [
    { jsonrpc: "2.0", id: 2, method: "getTokenAccountsByOwner", params: [address, { programId: TOKEN_PROGRAM }, { commitment: "confirmed", encoding: "jsonParsed" }] },
    { jsonrpc: "2.0", id: 3, method: "getTokenAccountsByOwner", params: [address, { programId: TOKEN_2022_PROGRAM }, { commitment: "confirmed", encoding: "jsonParsed" }] },
  ];
  const [balanceRpc, tokenRpc, market] = await Promise.all([
    requestRpc(balancePayload),
    requestRpc(tokenPayload).catch(() => null),
    getMarketData(),
  ]);
  const results = [...balanceRpc.results, ...(tokenRpc?.results ?? [])];

  const lamports = Number(results.find((result) => result.id === 1)?.result?.value ?? 0);
  const tokenAccounts = results
    .filter((result) => result.id === 2 || result.id === 3)
    .flatMap((result) => Array.isArray(result.result?.value) ? result.result.value : []);
  const balances = new Map<string, number>();
  for (const account of tokenAccounts) {
    const info = account.account.data.parsed.info;
    balances.set(info.mint, (balances.get(info.mint) ?? 0) + (info.tokenAmount.uiAmount ?? 0));
  }

  const holdings = market.assets.flatMap((asset) => {
    const balance = asset.symbol === "SOL" ? lamports / 1_000_000_000 : asset.mint ? balances.get(asset.mint) ?? 0 : 0;
    if (balance <= 0) return [];
    return [{
      symbol: asset.symbol,
      name: asset.name,
      mint: asset.mint,
      balance,
      price: asset.price,
      value: balance * asset.price,
      change24h: asset.change24h,
      color: asset.color,
      logoUrl: asset.logoUrl,
    }];
  }).sort((a, b) => b.value - a.value);
  const trackedMints = new Set(market.assets.map((asset) => asset.mint).filter(Boolean));

  return {
    address,
    rpcProvider: tokenRpc?.provider ?? balanceRpc.provider,
    holdings,
    totalValue: holdings.reduce((sum, holding) => sum + holding.value, 0),
    solBalance: lamports / 1_000_000_000,
    trackedTokenAccounts: tokenAccounts.filter((account) => trackedMints.has(account.account.data.parsed.info.mint)).length,
    untrackedTokenAccounts: tokenAccounts.filter((account) => !trackedMints.has(account.account.data.parsed.info.mint)).length,
    tokenDataAvailable: Boolean(tokenRpc),
    warning: tokenRpc ? null : "The public RPC limited SPL token discovery. Configure SOLANA_RPC_URL for complete token balances.",
    updatedAt: new Date().toISOString(),
  };
}
