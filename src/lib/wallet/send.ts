/**
 * 송금 (서명 + 방송).
 *
 * - ETH:   EIP-1559, micro-eth-signer Transaction.prepare → signBy → eth_sendRawTransaction
 * - USDT:  ERC-20 transfer(address,uint256) 호출 데이터 인코딩
 * - BTC:   mempool.space /address/{a}/utxo + selectUTXO → PSBT sign+finalize → POST /tx
 *
 * 모든 금액은 사용자 입력 문자열 → bigint(최소단위) 변환 후 사용.
 */

import { Transaction } from "micro-eth-signer";
import * as btc from "@scure/btc-signer";
import { hex } from "@scure/base";
import type { ChainEndpoints } from "./networks";

/* ---------------- 공통 ---------------- */

export function parseUnits(amount: string, decimals: number): bigint {
  const s = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("금액 형식 오류");
  const [whole, frac = ""] = s.split(".");
  if (frac.length > decimals) throw new Error(`소수점은 최대 ${decimals}자리`);
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded || "0");
}

async function rpc<T = unknown>(
  url: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = (await r.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(j.error.message);
  return j.result as T;
}

/* ---------------- ETH / USDT ---------------- */

function encodeErc20Transfer(to: string, amount: bigint): `0x${string}` {
  // transfer(address,uint256) = 0xa9059cbb
  const addr = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amt = amount.toString(16).padStart(64, "0");
  return ("0x" + "a9059cbb" + addr + amt) as `0x${string}`;
}

export interface EthFeeEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  totalFeeWei: bigint;
}

export async function estimateEthFee(
  ep: ChainEndpoints,
  from: string,
  to: string,
  value: bigint,
  data: `0x${string}` = "0x",
): Promise<EthFeeEstimate> {
  const [gasHex, prioHex, block] = await Promise.all([
    rpc<string>(ep.ethRpc, "eth_estimateGas", [
      { from, to, value: "0x" + value.toString(16), data },
    ]).catch(() => "0x5208"), // fallback 21000
    rpc<string>(ep.ethRpc, "eth_maxPriorityFeePerGas", []).catch(
      () => "0x77359400", // 2 gwei
    ),
    rpc<{ baseFeePerGas?: string }>(ep.ethRpc, "eth_getBlockByNumber", [
      "latest",
      false,
    ]),
  ]);
  const gasLimit = BigInt(gasHex);
  const priority = BigInt(prioHex);
  const baseFee = BigInt(block.baseFeePerGas ?? "0x0");
  const maxFee = baseFee * 2n + priority;
  return {
    gasLimit,
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: priority,
    totalFeeWei: gasLimit * maxFee,
  };
}

export interface SendEthParams {
  ep: ChainEndpoints;
  from: string;
  to: string;
  valueWei: bigint;
  data?: `0x${string}`;
  privateKey: Uint8Array;
}

export async function sendEthLike(p: SendEthParams): Promise<string> {
  const data: `0x${string}` = p.data ?? "0x";
  const [nonceHex, fee] = await Promise.all([
    rpc<string>(p.ep.ethRpc, "eth_getTransactionCount", [p.from, "pending"]),
    estimateEthFee(p.ep, p.from, p.to, p.valueWei, data),
  ]);
  const tx = Transaction.prepare({
    type: "eip1559",
    chainId: BigInt(p.ep.ethChainId),
    nonce: BigInt(nonceHex),
    to: p.to as `0x${string}`,
    value: p.valueWei,
    data,
    maxFeePerGas: fee.maxFeePerGas,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
    gasLimit: fee.gasLimit,
    accessList: [],
  });
  const signed = tx.signBy(p.privateKey);
  const raw = signed.toHex();
  const txid = await rpc<string>(p.ep.ethRpc, "eth_sendRawTransaction", [raw]);
  return txid;
}

export async function sendEth(
  ep: ChainEndpoints,
  from: string,
  to: string,
  amountEth: string,
  privateKey: Uint8Array,
): Promise<string> {
  return sendEthLike({
    ep,
    from,
    to,
    valueWei: parseUnits(amountEth, 18),
    privateKey,
  });
}

export async function sendUsdt(
  ep: ChainEndpoints,
  from: string,
  to: string,
  amountUsdt: string,
  privateKey: Uint8Array,
): Promise<string> {
  if (!ep.usdtContract) throw new Error("USDT는 메인넷에서만 지원");
  const amt = parseUnits(amountUsdt, 6);
  const data = encodeErc20Transfer(to, amt);
  return sendEthLike({
    ep,
    from,
    to: ep.usdtContract,
    valueWei: 0n,
    data,
    privateKey,
  });
}

/* ---------------- BTC ---------------- */

interface MempoolUtxo {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

export interface BtcFeeEstimate {
  feePerByte: bigint; // sat/vB
  estTotalSat: bigint;
}

export async function estimateBtcFee(ep: ChainEndpoints): Promise<bigint> {
  try {
    const r = await fetch(`${ep.btcApi}/v1/fees/recommended`);
    if (r.ok) {
      const j = (await r.json()) as { halfHourFee?: number; hourFee?: number };
      const v = j.halfHourFee ?? j.hourFee ?? 5;
      return BigInt(Math.max(1, Math.round(v)));
    }
  } catch {}
  return 5n;
}

export async function sendBtc(
  ep: ChainEndpoints,
  fromAddress: string,
  fromPubkey: Uint8Array,
  toAddress: string,
  amountBtc: string,
  privateKey: Uint8Array,
): Promise<string> {
  const isMainnet = ep.btcApi.indexOf("/testnet") === -1;
  const network = isMainnet ? btc.NETWORK : btc.TEST_NETWORK;
  const amountSat = parseUnits(amountBtc, 8);
  const feePerByte = await estimateBtcFee(ep);

  // 1) Fetch UTXOs
  const utxosRes = await fetch(`${ep.btcApi}/address/${fromAddress}/utxo`);
  if (!utxosRes.ok) throw new Error("UTXO 조회 실패");
  const utxos = (await utxosRes.json()) as MempoolUtxo[];
  if (utxos.length === 0) throw new Error("사용 가능한 UTXO가 없습니다");

  // 2) Build PSBT inputs
  const p2wpkh = btc.p2wpkh(fromPubkey, network);
  const inputs = utxos.map((u) => ({
    txid: u.txid,
    index: u.vout,
    witnessUtxo: { script: p2wpkh.script, amount: BigInt(u.value) },
    sighashType: btc.SigHash.ALL,
  }));

  // 3) Select UTXOs + build tx
  const result = btc.selectUTXO(
    inputs,
    [{ address: toAddress, amount: amountSat }],
    "default",
    {
      feePerByte,
      changeAddress: fromAddress,
      network,
      createTx: true,
      allowLegacyWitnessUtxo: true,
    } as never,
  );
  if (!result || !result.tx) throw new Error("UTXO 선택 실패 (잔액 부족 가능)");

  const tx = result.tx;
  // 4) Sign and finalize
  for (let i = 0; i < tx.inputsLength; i++) {
    tx.signIdx(privateKey, i);
  }
  tx.finalize();

  // 5) Broadcast
  const rawHex = hex.encode(tx.extract());
  const bRes = await fetch(`${ep.btcApi}/tx`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: rawHex,
  });
  const text = await bRes.text();
  if (!bRes.ok) throw new Error(`방송 실패: ${text}`);
  return text.trim();
}
