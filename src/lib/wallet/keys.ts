/**
 * 개인키 파생 — 서명 직전에만 호출하고 즉시 폐기.
 */
import { HDKey } from "@scure/bip32";
import { ed25519 } from "@noble/curves/ed25519.js";
import { mnemonicToSeedBytes } from "./seed";
import { deriveSolanaPrivKey } from "./derive";
import type { NetworkEnv } from "./store";

export interface PrivateKeys {
  ethPriv: Uint8Array; // BNB(BSC)도 동일 키 사용
  btcPriv: Uint8Array;
  btcPub: Uint8Array;
  solPriv: Uint8Array; // 32-byte ed25519 seed
  solPub: Uint8Array; // 32-byte 공개키
}

export async function derivePrivateKeys(mnemonic: string, env: NetworkEnv): Promise<PrivateKeys> {
  const seed = await mnemonicToSeedBytes(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const eth = root.derive("m/44'/60'/0'/0/0");
  const btcCoin = env === "mainnet" ? 0 : 1;
  const btc = root.derive(`m/84'/${btcCoin}'/0'/0/0`);
  if (!eth.privateKey || !btc.privateKey || !btc.publicKey) {
    throw new Error("DERIVE_PRIV_FAILED");
  }
  const solPriv = deriveSolanaPrivKey(seed);
  const solPub = ed25519.getPublicKey(solPriv);
  return {
    ethPriv: eth.privateKey,
    btcPriv: btc.privateKey,
    btcPub: btc.publicKey,
    solPriv,
    solPub,
  };
}
