/**
 * 온체인 거래내역 조회.
 *
 * - ETH/USDT: Blockscout v1 API (무료, API 키 불필요)
 *     mainnet: https://eth.blockscout.com/api
 *     sepolia: https://eth-sepolia.blockscout.com/api
 * - BTC:    mempool.space /address/{addr}/txs
 *
 * 모든 결과는 통일된 HistoryItem[] 으로 매핑한다.
 */

import type { ChainEndpoints } from "./networks";

export interface HistoryItem {
  id: string;
  hash: string;
  asset: "ETH" | "USDT" | "BTC";
  network: string;
  direction: "in" | "out" | "self";
  /** 사람이 읽는 단위 문자열 */
  amount: string;
  counterparty: string;
  timestamp: number; // ms
  status: "success" | "pending" | "failed";
  explorerUrl: string;
}

function blockscoutBase(ep: ChainEndpoints): string | null {
  if (ep.ethChainId === 1) return "https://eth.blockscout.com/api";
  if (ep.ethChainId === 11155111) return "https://eth-sepolia.blockscout.com/api";
  return null;
}

function fmtUnits(raw: bigint, decimals: number, dp = 6): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  let frac = (raw % base).toString().padStart(decimals, "0");
  if (dp < decimals) frac = frac.slice(0, dp);
  frac = frac.replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

function shorten(addr: string): string {
  if (!addr) return "—";
  if (addr.length <= 14) return addr;
  return addr.slice(0, 8) + "…" + addr.slice(-6);
}

interface BlockscoutTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  txreceipt_status: string;
}

interface BlockscoutTokenTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenDecimal: string;
  tokenSymbol: string;
  contractAddress: string;
}

export async function getEthHistory(
  ep: ChainEndpoints,
  address: string,
  limit = 25,
): Promise<HistoryItem[]> {
  const base = blockscoutBase(ep);
  if (!base) return [];
  const url = `${base}?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("ETH history HTTP " + r.status);
  const j = (await r.json()) as { status?: string; result?: BlockscoutTx[] };
  const txs = j.result ?? [];
  const me = address.toLowerCase();
  return txs.map((t) => {
    const from = t.from.toLowerCase();
    const to = (t.to || "").toLowerCase();
    const direction: HistoryItem["direction"] =
      from === me && to === me ? "self" : from === me ? "out" : "in";
    const failed = t.isError === "1" || t.txreceipt_status === "0";
    return {
      id: t.hash,
      hash: t.hash,
      asset: "ETH",
      network: ep.label,
      direction,
      amount: fmtUnits(BigInt(t.value || "0"), 18, 6),
      counterparty: shorten(direction === "out" ? t.to : t.from),
      timestamp: Number(t.timeStamp) * 1000,
      status: failed ? "failed" : "success",
      explorerUrl: `${ep.ethExplorer}/tx/${t.hash}`,
    };
  });
}

export async function getUsdtHistory(
  ep: ChainEndpoints,
  address: string,
  limit = 25,
): Promise<HistoryItem[]> {
  if (!ep.usdtContract) return [];
  const base = blockscoutBase(ep);
  if (!base) return [];
  const url = `${base}?module=account&action=tokentx&contractaddress=${ep.usdtContract}&address=${address}&sort=desc&page=1&offset=${limit}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("USDT history HTTP " + r.status);
  const j = (await r.json()) as { result?: BlockscoutTokenTx[] };
  const txs = j.result ?? [];
  const me = address.toLowerCase();
  return txs.map((t) => {
    const from = t.from.toLowerCase();
    const to = t.to.toLowerCase();
    const direction: HistoryItem["direction"] =
      from === me && to === me ? "self" : from === me ? "out" : "in";
    return {
      id: t.hash + ":" + (direction === "out" ? "o" : "i"),
      hash: t.hash,
      asset: "USDT",
      network: ep.label,
      direction,
      amount: fmtUnits(BigInt(t.value || "0"), Number(t.tokenDecimal) || 6, 2),
      counterparty: shorten(direction === "out" ? t.to : t.from),
      timestamp: Number(t.timeStamp) * 1000,
      status: "success",
      explorerUrl: `${ep.ethExplorer}/tx/${t.hash}`,
    };
  });
}

interface MempoolTx {
  txid: string;
  status: { confirmed: boolean; block_time?: number };
  vin: { prevout?: { scriptpubkey_address?: string; value: number } }[];
  vout: { scriptpubkey_address?: string; value: number }[];
}

export async function getBtcHistory(
  ep: ChainEndpoints,
  address: string,
): Promise<HistoryItem[]> {
  const r = await fetch(`${ep.btcApi}/address/${address}/txs`);
  if (!r.ok) throw new Error("BTC history HTTP " + r.status);
  const txs = (await r.json()) as MempoolTx[];
  return txs.map((t) => {
    const inSum = t.vin
      .filter((v) => v.prevout?.scriptpubkey_address === address)
      .reduce((s, v) => s + (v.prevout?.value ?? 0), 0);
    const outSum = t.vout
      .filter((v) => v.scriptpubkey_address === address)
      .reduce((s, v) => s + v.value, 0);
    const delta = outSum - inSum; // sat
    const direction: HistoryItem["direction"] =
      delta > 0 ? "in" : delta < 0 ? "out" : "self";
    // counterparty: 첫 번째 상대 주소
    const counterAddr =
      direction === "out"
        ? t.vout.find((v) => v.scriptpubkey_address && v.scriptpubkey_address !== address)
            ?.scriptpubkey_address
        : t.vin.find((v) => v.prevout?.scriptpubkey_address && v.prevout.scriptpubkey_address !== address)
            ?.prevout?.scriptpubkey_address;
    return {
      id: t.txid,
      hash: t.txid,
      asset: "BTC",
      network: ep.label,
      direction,
      amount: fmtUnits(BigInt(Math.abs(delta)), 8, 8),
      counterparty: shorten(counterAddr ?? ""),
      timestamp: (t.status.block_time ?? Math.floor(Date.now() / 1000)) * 1000,
      status: t.status.confirmed ? "success" : "pending",
      explorerUrl: `${ep.btcExplorer}/tx/${t.txid}`,
    };
  });
}

export async function getAllHistory(
  ep: ChainEndpoints,
  ethAddress: string,
  btcAddress: string,
): Promise<HistoryItem[]> {
  const [eth, usdt, btc] = await Promise.all([
    getEthHistory(ep, ethAddress).catch(() => []),
    getUsdtHistory(ep, ethAddress).catch(() => []),
    getBtcHistory(ep, btcAddress).catch(() => []),
  ]);
  return [...eth, ...usdt, ...btc].sort((a, b) => b.timestamp - a.timestamp);
}
