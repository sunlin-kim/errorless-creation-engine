/**
 * 지갑 런타임 상태 (Zustand) — 시드는 메모리만, 자동 잠금 설정은 localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type NetworkEnv = "testnet" | "mainnet";

interface WalletState {
  vaultExists: boolean | null;
  /** 잠금 해제된 평문 니모닉 — 메모리에만 (persist 제외) */
  mnemonic: string | null;
  network: NetworkEnv;
  /** 자동 잠금 분 — 0 이면 비활성 */
  autoLockMinutes: number;
  /** 마지막 사용자 활동 timestamp (ms) */
  lastActivity: number;

  setVaultExists: (v: boolean) => void;
  unlock: (mnemonic: string) => void;
  lock: () => void;
  setNetwork: (n: NetworkEnv) => void;
  setAutoLockMinutes: (m: number) => void;
  touchActivity: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      vaultExists: null,
      mnemonic: null,
      network: "mainnet",
      autoLockMinutes: 0,
      lastActivity: Date.now(),

      setVaultExists: (v) => set({ vaultExists: v }),
      unlock: (mnemonic) => set({ mnemonic, lastActivity: Date.now() }),
      lock: () => set({ mnemonic: null }),
      setNetwork: (n) => set({ network: n }),
      setAutoLockMinutes: (m) => set({ autoLockMinutes: Math.max(0, m) }),
      touchActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: "sv-wallet-prefs-v3",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        network: s.network,
        autoLockMinutes: s.autoLockMinutes,
      }),
    },
  ),
);

export function isUnlocked(): boolean {
  return useWalletStore.getState().mnemonic !== null;
}
