/**
 * 지갑 런타임 상태 (Zustand, persist 없음 — 메모리만).
 *
 * - 평문 mnemonic 은 unlock 후에만 존재하고, lock() 시 즉시 폐기
 * - 네트워크 환경: testnet 기본 (안전)
 * - 5분 미사용 자동 잠금은 추후 Step 5에서 추가
 */

import { create } from "zustand";

export type NetworkEnv = "testnet" | "mainnet";

interface WalletState {
  /** vault 존재 여부 (앱 부팅 시 1회 체크) */
  vaultExists: boolean | null;
  /** 잠금 해제된 평문 니모닉 — 메모리에만 */
  mnemonic: string | null;
  /** 현재 네트워크 환경 */
  network: NetworkEnv;

  setVaultExists: (v: boolean) => void;
  unlock: (mnemonic: string) => void;
  lock: () => void;
  setNetwork: (n: NetworkEnv) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  vaultExists: null,
  mnemonic: null,
  network: "testnet",

  setVaultExists: (v) => set({ vaultExists: v }),
  unlock: (mnemonic) => set({ mnemonic }),
  lock: () => set({ mnemonic: null }),
  setNetwork: (n) => set({ network: n }),
}));

export function isUnlocked(): boolean {
  return useWalletStore.getState().mnemonic !== null;
}
