/**
 * session_request 라우터 — dApp 의 RPC 요청을 처리한다.
 *
 * - personal_sign / eth_sign      → personalSign
 * - eth_signTypedData[_v4]        → signTypedDataV4
 * - eth_sendTransaction           → sendEthLike (체인별 ChainEndpoints 분기)
 * - wallet_switchEthereumChain    → 지원 체인이면 null OK
 * - wallet_addEthereumChain       → 지원 체인이면 null OK, 아니면 4902
 *
 * 호출자는 사용자 승인 직후 mnemonic 을 보유한 상태에서 호출해야 한다.
 * 개인키는 함수 안에서만 파생되고 즉시 폐기.
 */

import { derivePrivateKeys } from "../keys";
import { getEndpoints } from "../networks";
import { sendEthLike, toBscEndpoints } from "../send";
import { personalSign, signTypedDataV4 } from "./sign";
import { chainInfoFromEip155 } from "./config";

export interface HandleRequestArgs {
  mnemonic: string;
  /** 우리 EVM EOA 주소 (체크섬) */
  evmAddress: string;
  chainId: string; // eip155:N
  method: string;
  params: unknown;
}

export type HandleResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: number; message: string } };

function asHex(v: unknown): `0x${string}` {
  if (typeof v !== "string") throw new Error("Expected hex string");
  if (!/^0x[0-9a-fA-F]*$/.test(v)) throw new Error("Invalid hex string");
  return v as `0x${string}`;
}

function bigIntFromHex(v: unknown, fallback: bigint = 0n): bigint {
  if (typeof v !== "string" || v === "0x" || v === "") return fallback;
  return BigInt(v);
}

export async function handleSessionRequest(args: HandleRequestArgs): Promise<HandleResult> {
  const { mnemonic, evmAddress, chainId, method, params } = args;
  const chain = chainInfoFromEip155(chainId);
  if (!chain) {
    return { ok: false, error: { code: 4901, message: `Unsupported chain: ${chainId}` } };
  }

  try {
    switch (method) {
      /* ─── signing ─────────────────────────────────────────────────────── */
      case "personal_sign": {
        const arr = params as unknown[];
        // params: [message, address] (account-id-first or message-first 둘 다 허용)
        const message = typeof arr[0] === "string" && arr[0].startsWith("0x") ? arr[0] : (arr[1] as string);
        const keys = await derivePrivateKeys(mnemonic, chain.network);
        try {
          const sig = personalSign(message, keys.ethPriv);
          return { ok: true, result: sig };
        } finally {
          keys.ethPriv.fill(0);
          keys.btcPriv.fill(0);
          keys.solPriv.fill(0);
        }
      }
      case "eth_sign": {
        const arr = params as [string, string];
        const message = arr[1];
        const keys = await derivePrivateKeys(mnemonic, chain.network);
        try {
          const sig = personalSign(message, keys.ethPriv);
          return { ok: true, result: sig };
        } finally {
          keys.ethPriv.fill(0);
          keys.btcPriv.fill(0);
          keys.solPriv.fill(0);
        }
      }
      case "eth_signTypedData":
      case "eth_signTypedData_v3":
      case "eth_signTypedData_v4": {
        const arr = params as [string, string | object];
        const typedData = arr[1];
        const keys = await derivePrivateKeys(mnemonic, chain.network);
        try {
          const sig = signTypedDataV4(typedData, keys.ethPriv);
          return { ok: true, result: sig };
        } finally {
          keys.ethPriv.fill(0);
          keys.btcPriv.fill(0);
          keys.solPriv.fill(0);
        }
      }

      /* ─── transactions ────────────────────────────────────────────────── */
      case "eth_sendTransaction": {
        const arr = params as [
          {
            from?: string;
            to?: string;
            value?: string;
            data?: string;
            gas?: string;
            gasLimit?: string;
          },
        ];
        const tx = arr[0];
        if (!tx?.to) {
          return { ok: false, error: { code: -32602, message: "Missing 'to' in transaction" } };
        }
        // ChainEndpoints — chain 종류에 따라 분기
        let ep = getEndpoints(chain.network);
        if (chain.kind === "bsc") {
          ep = toBscEndpoints(ep);
          // toBscEndpoints는 ChainEndpoints의 ethChainId 도 BSC chainId 로 교체함
        } else {
          // ETH mainnet — getEndpoints("mainnet").ethChainId = 1 으로 이미 OK
        }
        const data = (tx.data && tx.data !== "0x" ? asHex(tx.data) : "0x") as `0x${string}`;
        const valueWei = bigIntFromHex(tx.value, 0n);
        const keys = await derivePrivateKeys(mnemonic, chain.network);
        try {
          const txid = await sendEthLike({
            ep,
            from: evmAddress,
            to: tx.to,
            valueWei,
            data,
            privateKey: keys.ethPriv,
          });
          return { ok: true, result: txid };
        } finally {
          keys.ethPriv.fill(0);
          keys.btcPriv.fill(0);
          keys.solPriv.fill(0);
        }
      }
      case "eth_sendRawTransaction": {
        return {
          ok: false,
          error: { code: -32601, message: "eth_sendRawTransaction not supported by this wallet" },
        };
      }

      /* ─── chain management ────────────────────────────────────────────── */
      case "wallet_switchEthereumChain":
      case "wallet_addEthereumChain": {
        const arr = params as [{ chainId?: string }];
        const wanted = arr?.[0]?.chainId;
        const wantedNum = wanted ? Number(BigInt(wanted)) : NaN;
        if (wantedNum === 1 || wantedNum === 56 || wantedNum === 97) {
          return { ok: true, result: null };
        }
        return {
          ok: false,
          error: {
            code: 4902,
            message: `Chain ${wanted ?? "?"} is not supported by Supervizion`,
          },
        };
      }

      default:
        return { ok: false, error: { code: -32601, message: `Method not supported: ${method}` } };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[wc] handler error", method, msg);
    return { ok: false, error: { code: -32000, message: msg } };
  }
}
