/**
 * HD 키 파생 → ETH / BNB(BSC) / BTC / SOL 주소 생성.
 *
 * - BIP44 Ethereum: m/44'/60'/0'/0/0  (BNB/BSC도 동일 EVM 주소 사용)
 * - BIP84 Bitcoin native segwit (p2wpkh):
 *     mainnet: m/84'/0'/0'/0/0  (bc1...)
 *     testnet: m/84'/1'/0'/0/0  (tb1...)
 * - Solana (SLIP-0010 ed25519): m/44'/501'/0'/0'  (Phantom 호환)
 *
 * 개인키는 절대 반환하지 않으며, 외부로 노출되지 않는다.
 */

import { HDKey } from "@scure/bip32";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { bech32, base58 } from "@scure/base";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { mnemonicToSeedBytes } from "./seed";
import type { NetworkEnv } from "./store";

export interface DerivedAddresses {
  eth: string;
  ethPath: string;
  bnb: string; // EVM 주소 (BSC) — eth와 동일
  bnbPath: string;
  btc: string;
  btcPath: string;
  sol: string;
  solPath: string;
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
  const uncompressed = point.toBytes(false);
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
  const words = [0, ...bech32.toWords(hash160)];
  return bech32.encode(hrp, words);
}

/**
 * SLIP-0010 ed25519 derivation (hardened-only).
 * 경로 예: m/44'/501'/0'/0'
 */
function ser32(i: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, i, false);
  return b;
}

function ed25519MasterKey(seed: Uint8Array): { key: Uint8Array; cc: Uint8Array } {
  const I = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  return { key: I.slice(0, 32), cc: I.slice(32) };
}

function ed25519CKDpriv(
  parent: { key: Uint8Array; cc: Uint8Array },
  index: number,
): { key: Uint8Array; cc: Uint8Array } {
  // 하드닝 비트 강제 (ed25519 SLIP-0010은 hardened 전용)
  const idx = index | 0x80000000;
  const data = new Uint8Array(1 + 32 + 4);
  data[0] = 0x00;
  data.set(parent.key, 1);
  data.set(ser32(idx >>> 0), 33);
  const I = hmac(sha512, parent.cc, data);
  return { key: I.slice(0, 32), cc: I.slice(32) };
}

function deriveSolanaAddress(seed: Uint8Array): string {
  // m/44'/501'/0'/0'
  let node = ed25519MasterKey(seed);
  for (const idx of [44, 501, 0, 0]) {
    node = ed25519CKDpriv(node, idx);
  }
  const pub = ed25519.getPublicKey(node.key);
  return base58.encode(pub);
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

  const ethAddr = ethAddressFromPubkey(ethNode.publicKey);
  const solAddr = deriveSolanaAddress(seed);

  return {
    eth: ethAddr,
    ethPath,
    bnb: ethAddr, // BSC는 EVM이므로 동일 주소
    bnbPath: ethPath,
    btc: btcP2wpkhFromPubkey(btcNode.publicKey, env),
    btcPath,
    sol: solAddr,
    solPath: "m/44'/501'/0'/0'",
  };
}
