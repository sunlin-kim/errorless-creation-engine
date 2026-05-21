/**
 * HD 키 파생 → ETH / BTC 주소 생성.
 *
 * - BIP44 Ethereum: m/44'/60'/0'/0/0
 * - BIP84 Bitcoin native segwit (p2wpkh):
 *     mainnet: m/84'/0'/0'/0/0  (bc1...)
 *     testnet: m/84'/1'/0'/0/0  (tb1...)
 *
 * 개인키는 절대 반환하지 않으며, 외부로 노출되지 않는다.
 * 서명이 필요한 경로에서만 동일 함수로 다시 파생.
 */

import { HDKey } from "@scure/bip32";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { bech32 } from "@scure/base";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { mnemonicToSeedBytes } from "./seed";
import type { NetworkEnv } from "./store";

export interface DerivedAddresses {
  eth: string; // 0x...
  ethPath: string;
  btc: string; // bc1... or tb1...
  btcPath: string;
}

function toHex(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

/** EIP-55 체크섬 주소 */
function toChecksumAddress(addrLower: string): string {
  const a = addrLower.replace(/^0x/, "").toLowerCase();
  const hashBytes = keccak_256(new TextEncoder().encode(a));
  const hash = toHex(hashBytes);
  let out = "0x";
  for (let i = 0; i < a.length; i++) {
    out += parseInt(hash[i], 16) >= 8 ? a[i].toUpperCase() : a[i];
  }
  return out;
}

function ethAddressFromPubkey(compressedPub: Uint8Array): string {
  const point = secp256k1.Point.fromBytes(compressedPub);
  const uncompressed = point.toBytes(false); // 65 bytes, leading 0x04
  const hash = keccak_256(uncompressed.slice(1));
  const addr = toHex(hash.slice(-20));
  return toChecksumAddress("0x" + addr);
}

function btcP2wpkhFromPubkey(
  compressedPub: Uint8Array,
  env: NetworkEnv,
): string {
  const sha = sha256(compressedPub);
  const hash160 = ripemd160(sha);
  const hrp = env === "mainnet" ? "bc" : "tb";
  // witness version 0 + 5-bit words of hash160
  const words = [0, ...bech32.toWords(hash160)];
  return bech32.encode(hrp, words);
}

export async function deriveAddresses(
  mnemonic: string,
  env: NetworkEnv,
): Promise<DerivedAddresses> {
  const seed = await mnemonicToSeedBytes(mnemonic);
  const root = HDKey.fromMasterSeed(seed);

  const ethPath = "m/44'/60'/0'/0/0";
  const btcCoin = env === "mainnet" ? 0 : 1;
  const btcPath = `m/84'/${btcCoin}'/0'/0/0`;

  const ethNode = root.derive(ethPath);
  const btcNode = root.derive(btcPath);
  if (!ethNode.publicKey || !btcNode.publicKey) {
    throw new Error("DERIVE_FAILED");
  }

  return {
    eth: ethAddressFromPubkey(ethNode.publicKey),
    ethPath,
    btc: btcP2wpkhFromPubkey(btcNode.publicKey, env),
    btcPath,
  };
}
