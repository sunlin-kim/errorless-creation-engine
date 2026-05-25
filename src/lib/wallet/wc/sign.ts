/**
 * EIP-191 (personal_sign / eth_sign) + EIP-712 (typed data v4) 서명.
 *
 * micro-eth-signer 의 정합 구현을 직접 사용.
 *   - eip191Signer.sign(message, privateKey)  → "\x19Ethereum Signed Message:..." prefix
 *   - signTyped(typed, privateKey)            → EIP-712 v4 호환
 */

import { eip191Signer, signTyped, type TypedData, type EIP712Types } from "micro-eth-signer";

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

function privKeyToHex(pk: Uint8Array): string {
  return "0x" + bytesToHex(pk);
}

/**
 * personal_sign / eth_sign — dApp 이 보내는 message 는 보통 0x-prefixed hex.
 * hex 면 raw bytes 로 디코드해서 서명하고, 아니면 그 문자열 자체를 UTF-8 로 본다.
 */
export function personalSign(messageHexOrUtf8: string, privateKey: Uint8Array): `0x${string}` {
  const msg = /^0x[0-9a-fA-F]*$/.test(messageHexOrUtf8)
    ? hexToBytes(messageHexOrUtf8)
    : new TextEncoder().encode(messageHexOrUtf8);
  // eip191Signer.sign returns "0x..." string with prefix
  const sig = eip191Signer.sign(msg, privKeyToHex(privateKey));
  return (typeof sig === "string" ? sig : ("0x" + bytesToHex(sig as Uint8Array))) as `0x${string}`;
}

/** EIP-712 typed data v4 — dApp 이 보내는 JSON 문자열 또는 객체. */
export function signTypedDataV4(
  typedDataJson: string | object,
  privateKey: Uint8Array,
): `0x${string}` {
  const td = (
    typeof typedDataJson === "string" ? JSON.parse(typedDataJson) : typedDataJson
  ) as TypedData<EIP712Types, string>;
  const sig = signTyped(td, privKeyToHex(privateKey));
  return (sig.startsWith("0x") ? sig : "0x" + sig) as `0x${string}`;
}

export { bytesToHex, hexToBytes };
