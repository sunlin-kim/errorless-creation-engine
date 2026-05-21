/**
 * 지갑 런타임 상태 (Zustand) — 시드는 메모리만, 자동 잠금 설정은 localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clearUnlockedMnemonic, saveUnlockedMnemonic } from "./session";

export type NetworkEnv = "testnet" | "mainnet";
export type FiatCurrency = "KRW" | "USD";
export type AppLanguage = "ko" | "en";

interface WalletState {
  vaultExists: boolean | null;
  /** 잠금 해제된 평문 니모닉 — 메모리에만 (persist 제외) */
  mnemonic: string | null;
  network: NetworkEnv;
  currency: FiatCurrency;
  language: AppLanguage;
  /** 자동 잠금 분 — 0 이면 비활성 */
  autoLockMinutes: number;
  /** 마지막 사용자 활동 timestamp (ms) */
  lastActivity: number;

  setVaultExists: (v: boolean) => void;
  unlock: (mnemonic: string) => void;
  lock: () => void;
  setNetwork: (n: NetworkEnv) => void;
  setCurrency: (c: FiatCurrency) => void;
  setLanguage: (l: AppLanguage) => void;
  setAutoLockMinutes: (m: number) => void;
  touchActivity: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      vaultExists: null,
      mnemonic: null,
      network: "mainnet",
      currency: "KRW",
      language: "ko",
      autoLockMinutes: 0,
      lastActivity: Date.now(),

      setVaultExists: (v) => set({ vaultExists: v }),
      unlock: (mnemonic) => {
        void saveUnlockedMnemonic(mnemonic);
        set({ mnemonic, lastActivity: Date.now() });
      },
      lock: () => {
        void clearUnlockedMnemonic();
        set({ mnemonic: null });
      },
      setNetwork: (n) => set({ network: n }),
      setCurrency: (c) => set({ currency: c }),
      setLanguage: (l) => set({ language: l }),
      setAutoLockMinutes: (m) => set({ autoLockMinutes: Math.max(0, m) }),
      touchActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: "sv-wallet-prefs-v4",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        network: s.network,
        currency: s.currency,
        language: s.language,
        autoLockMinutes: s.autoLockMinutes,
      }),
    },
  ),
);

export function isUnlocked(): boolean {
  return useWalletStore.getState().mnemonic !== null;
}
