/**
 * EIP-191 personal_sign / eth_sign 서명 유틸 — secp256k1 + keccak256.
 *
 * - personal_sign: "\x19Ethereum Signed Message:\n" + len + msg 를 keccak256 후 서명
 * - eth_sign:      메시지(이미 hash 라고 가정) 를 직접 서명 (dApp 호환 위해 동일하게 prefix 처리)
 *
 * 서명 포맷: 0x{r:32}{s:32}{v:1}  (v 는 27/28)
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

function decodeMaybeHexUtf8(input: string): Uint8Array {
  // dApp 은 보통 hex string 으로 메시지 전달. 그 외엔 utf-8 raw 로 본다.
  if (/^0x[0-9a-fA-F]*$/.test(input)) return hexToBytes(input);
  return new TextEncoder().encode(input);
}

function personalHash(message: Uint8Array): Uint8Array {
  const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${message.length}`);
  const full = new Uint8Array(prefix.length + message.length);
  full.set(prefix, 0);
  full.set(message, prefix.length);
  return keccak_256(full);
}

export function personalSign(messageHexOrUtf8: string, privateKey: Uint8Array): `0x${string}` {
  const msgBytes = decodeMaybeHexUtf8(messageHexOrUtf8);
  const digest = personalHash(msgBytes);
  const sig = secp256k1.sign(digest, privateKey, { lowS: true });
  const r = sig.r.toString(16).padStart(64, "0");
  const s = sig.s.toString(16).padStart(64, "0");
  const v = (sig.recovery + 27).toString(16).padStart(2, "0");
  return `0x${r}${s}${v}` as `0x${string}`;
}

/** EIP-712 typed data v4 — JSON 문자열 또는 객체를 받는다. */
export async function signTypedDataV4(
  typedDataJson: string,
  privateKey: Uint8Array,
): Promise<`0x${string}`> {
  const td =
    typeof typedDataJson === "string" ? JSON.parse(typedDataJson) : (typedDataJson as object);
  // micro-eth-signer 의 typed-data 모듈 사용 (v4 호환)
  const mod: { encoder?: (td: unknown) => { hash?: () => Uint8Array }; default?: unknown } =
    await import("micro-eth-signer/typed-data");
  const encoder = (mod as { encoder?: (td: unknown) => { hash?: () => Uint8Array } }).encoder;
  if (typeof encoder !== "function") {
    throw new Error("typed-data encoder not available");
  }
  const enc = encoder(td);
  if (!enc || typeof enc.hash !== "function") {
    throw new Error("typed-data encoder hash() missing");
  }
  const digest = enc.hash();
  const sig = secp256k1.sign(digest, privateKey, { lowS: true });
  const r = sig.r.toString(16).padStart(64, "0");
  const s = sig.s.toString(16).padStart(64, "0");
  const v = (sig.recovery + 27).toString(16).padStart(2, "0");
  return `0x${r}${s}${v}` as `0x${string}`;
}

export { bytesToHex, hexToBytes };
