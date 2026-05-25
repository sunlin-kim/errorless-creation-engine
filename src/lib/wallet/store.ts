/**
 * 지갑 런타임 상태 (Zustand) — 시드는 메모리만, 자동 잠금 설정은 localStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function debugWallet(event: string, payload?: Record<string, unknown>) {
  if (typeof console === "undefined") return;
  console.info("[wallet-debug]", event, payload ?? {});
}

export type NetworkEnv = "testnet" | "mainnet";
export type FiatCurrency = "KRW" | "USD";
export type AppLanguage = "ko" | "en";

function sanitizePersistedState(state: Partial<WalletState> | undefined) {
  return {
    network: state?.network === "mainnet" || state?.network === "testnet" ? state.network : "testnet",
    currency: state?.currency === "USD" || state?.currency === "KRW" ? state.currency : "KRW",
    language: state?.language === "en" || state?.language === "ko" ? state.language : "ko",
    autoLockMinutes:
      typeof state?.autoLockMinutes === "number" && Number.isFinite(state.autoLockMinutes)
        ? Math.max(0, state.autoLockMinutes)
        : 10,
  } as const;
}

interface WalletState {
  vaultExists: boolean | null;
  /** 잠금 해제된 평문 니모닉 — 메모리에만 (persist 제외) */
  mnemonic: string | null;
  /** unlock 직후 auto-lock 오작동 방지용 짧은 유예 구간 */
  autoLockGraceUntil: number;
  derivedAddresses: {
    mainnet: { eth: string; btc: string; bnb: string; sol: string } | null;
    testnet: { eth: string; btc: string; bnb: string; sol: string } | null;
  };
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
  setDerivedAddresses: (
    env: NetworkEnv,
    addresses: { eth: string; btc: string; bnb: string; sol: string },
  ) => void;
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
      autoLockGraceUntil: 0,
      derivedAddresses: { mainnet: null, testnet: null },
      network: "testnet",
      currency: "KRW",
      language: "ko",
      autoLockMinutes: 10,
      lastActivity: Date.now(),

      setVaultExists: (v) => set({ vaultExists: v }),
      unlock: (mnemonic) => {
        const now = Date.now();
        debugWallet("unlock", { now, length: mnemonic.length });
        set({ mnemonic, lastActivity: now, autoLockGraceUntil: now + 30_000 });
      },
      lock: () => {
        debugWallet("lock", {
          now: Date.now(),
          hadMnemonic: useWalletStore.getState().mnemonic !== null,
          stack: new Error().stack,
        });
        set({
          mnemonic: null,
          autoLockGraceUntil: 0,
          derivedAddresses: { mainnet: null, testnet: null },
        });
      },
      setDerivedAddresses: (env, addresses) =>
        set((s) => ({
          derivedAddresses: {
            ...s.derivedAddresses,
            [env]: addresses,
          },
        })),
      setNetwork: (n) => set({ network: n }),
      setCurrency: (c) => set({ currency: c }),
      setLanguage: (l) => set({ language: l }),
      setAutoLockMinutes: (m) => set({ autoLockMinutes: Math.max(0, m) }),
      touchActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: "sv-wallet-prefs-v5",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState as Partial<WalletState> | undefined),
      }),
      migrate: (persistedState) => sanitizePersistedState(persistedState as Partial<WalletState>),
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

export function hasWalletStoreHydrated(): boolean {
  return useWalletStore.persist.hasHydrated();
}

export function rehydrateWalletStore(): Promise<void> {
  debugWallet("rehydrate:start", { hydrated: useWalletStore.persist.hasHydrated() });
  return Promise.resolve(useWalletStore.persist.rehydrate());
}
