/**
 * 잔액·가격 조회.
 *
 * - ETH: JSON-RPC eth_getBalance (wei)
 * - USDT (ERC-20, mainnet 한정): eth_call balanceOf
 * - BTC: mempool.space /address/{addr} → funded - spent (sat)
 * - 가격: CoinGecko simple/price (KRW)
 *
 * 모든 정수 단위는 bigint 로 다룬다. 표시 단계에서만 number 로 포맷.
 */

import type { ChainEndpoints } from "./networks";

export interface AssetBalance {
  symbol: "ETH" | "BTC" | "USDT" | "BNB" | "SOL" | "DUCKY";
  /** 최소 단위 정수 (wei / satoshi / 6-decimals / lamports) */
  raw: bigint;
  /** 사람이 읽는 단위 */
  formatted: string;
  decimals: number;
}

const ETH_DECIMALS = 18;
const BTC_DECIMALS = 8;
const USDT_DECIMALS = 6;
const BNB_DECIMALS = 18;
const SOL_DECIMALS = 9;
const DUCKY_DECIMALS = 9;

function formatUnits(raw: bigint, decimals: number, displayDp = 6): string {
  const neg = raw < 0n;
  const v = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  let fracStr = frac.toString().padStart(decimals, "0");
  if (displayDp < decimals) fracStr = fracStr.slice(0, displayDp);
  fracStr = fracStr.replace(/0+$/, "");
  const out = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return neg ? "-" + out : out;
}

async function rpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!r.ok) throw new Error(`RPC ${method} HTTP ${r.status}`);
  const j = (await r.json()) as { result?: unknown; error?: { message: string } };
  if (j.error) throw new Error(`RPC ${method}: ${j.error.message}`);
  return j.result;
}

export async function getEthBalance(
  ep: ChainEndpoints,
  address: string,
): Promise<AssetBalance> {
  const hex = (await rpc(ep.ethRpc, "eth_getBalance", [address, "latest"])) as string;
  const raw = BigInt(hex);
  return {
    symbol: "ETH",
    raw,
    decimals: ETH_DECIMALS,
    formatted: formatUnits(raw, ETH_DECIMALS, 6),
  };
}

/** ERC-20 balanceOf(address) — mainnet USDT */
export async function getUsdtBalance(
  ep: ChainEndpoints,
  address: string,
): Promise<AssetBalance | null> {
  if (!ep.usdtContract) return null;
  // balanceOf(address) selector = 0x70a08231
  const padded = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const data = "0x70a08231" + padded;
  const hex = (await rpc(ep.ethRpc, "eth_call", [
    { to: ep.usdtContract, data },
    "latest",
  ])) as string;
  const raw = hex && hex !== "0x" ? BigInt(hex) : 0n;
  return {
    symbol: "USDT",
    raw,
    decimals: USDT_DECIMALS,
    formatted: formatUnits(raw, USDT_DECIMALS, 2),
  };
}

export async function getBtcBalance(
  ep: ChainEndpoints,
  address: string,
): Promise<AssetBalance> {
  const r = await fetch(`${ep.btcApi}/address/${address}`);
  if (!r.ok) throw new Error(`BTC API HTTP ${r.status}`);
  const j = (await r.json()) as {
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
    mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
  };
  const c = j.chain_stats;
  const m = j.mempool_stats;
  const raw =
    BigInt(c.funded_txo_sum) -
    BigInt(c.spent_txo_sum) +
    BigInt(m.funded_txo_sum) -
    BigInt(m.spent_txo_sum);
  return {
    symbol: "BTC",
    raw,
    decimals: BTC_DECIMALS,
    formatted: formatUnits(raw, BTC_DECIMALS, 8),
  };
}

export async function getBnbBalance(
  ep: ChainEndpoints,
  address: string,
): Promise<AssetBalance> {
  const hex = (await rpc(ep.bscRpc, "eth_getBalance", [address, "latest"])) as string;
  const raw = BigInt(hex);
  return {
    symbol: "BNB",
    raw,
    decimals: BNB_DECIMALS,
    formatted: formatUnits(raw, BNB_DECIMALS, 6),
  };
}

export async function getSolBalance(
  ep: ChainEndpoints,
  address: string,
): Promise<AssetBalance> {
  const r = await fetch(ep.solRpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address],
    }),
  });
  if (!r.ok) throw new Error(`SOL RPC HTTP ${r.status}`);
  const j = (await r.json()) as {
    result?: { value: number };
    error?: { message: string };
  };
  if (j.error) throw new Error(`SOL: ${j.error.message}`);
  const raw = BigInt(j.result?.value ?? 0);
  return {
    symbol: "SOL",
    raw,
    decimals: SOL_DECIMALS,
    formatted: formatUnits(raw, SOL_DECIMALS, 6),
  };
}

export interface PriceMap {
  ETH: number;
  BTC: number;
  USDT: number;
  BNB: number;
  SOL: number;
  DUCKY: number;
}

export interface PricesResult {
  prices: PriceMap;
  changes24h: PriceMap;
}

export type FiatCode = "KRW" | "USD";

export async function getPrices(fiat: FiatCode = "KRW"): Promise<PricesResult> {
  const vs = fiat.toLowerCase();
  const changeKey = `${vs}_24h_change`;
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether,binancecoin,solana,duckyduck&vs_currencies=${vs}&include_24hr_change=true`,
    );
    if (!r.ok) throw new Error("price HTTP " + r.status);
    const j = (await r.json()) as Record<string, Record<string, number>>;
    const px = (id: string) => j[id]?.[vs] ?? 0;
    const ch = (id: string) => j[id]?.[changeKey] ?? 0;
    return {
      prices: {
        ETH: px("ethereum"),
        BTC: px("bitcoin"),
        USDT: px("tether"),
        BNB: px("binancecoin"),
        SOL: px("solana"),
        DUCKY: px("duckyduck"),
      },
      changes24h: {
        ETH: ch("ethereum"),
        BTC: ch("bitcoin"),
        USDT: ch("tether"),
        BNB: ch("binancecoin"),
        SOL: ch("solana"),
        DUCKY: ch("duckyduck"),
      },
    };
  } catch {
    const zero = { ETH: 0, BTC: 0, USDT: 0, BNB: 0, SOL: 0, DUCKY: 0 };
    return { prices: zero, changes24h: zero };
  }
}

/** @deprecated use getPrices("KRW") */
export const getPricesKrw = () => getPrices("KRW");

export function toFiat(b: AssetBalance, prices: PriceMap): number {
  const price = prices[b.symbol] ?? 0;
  if (price === 0) return 0;
  const base = 10n ** BigInt(b.decimals);
  const whole = Number(b.raw / base);
  const frac = Number(b.raw % base) / Number(base);
  return (whole + frac) * price;
}

/** @deprecated use toFiat */
export const toKrw = toFiat;

export function formatFiat(n: number, fiat: FiatCode = "KRW"): string {
  if (!Number.isFinite(n)) return fiat === "KRW" ? "₩0" : "$0";
  if (fiat === "KRW") {
    if (n === 0) return "₩0";
    return "₩" + Math.round(n).toLocaleString("ko-KR");
  }
  if (n === 0) return "$0.00";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @deprecated use formatFiat(n, "KRW") */
export const formatKrw = (n: number) => formatFiat(n, "KRW");
