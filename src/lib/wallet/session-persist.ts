/**
 * Tab-scoped mnemonic cache.
 *
 * Stores the unlocked mnemonic in sessionStorage so that the wallet stays
 * unlocked across SPA reloads / TanStack route remounts / HMR within the
 * SAME browser tab. sessionStorage is automatically cleared when the tab
 * closes, so the secret cannot leak across tabs or persist on disk.
 *
 * Trade-off vs the previous "memory only" model:
 *   - Pro: unlock survives reload — fixes the "unlock → re-init → locked
 *     again" loop users hit after a refresh or hot module reload.
 *   - Con: an active XSS within the tab can read sessionStorage.
 *     Mitigated by: CSP, no third-party script eval, sessionStorage scope
 *     (no persistence across sessions / no leak to other tabs).
 *
 * Legacy localStorage keys (if any from older builds) are wiped.
 */

import { useEffect } from "react";
import { useWalletStore } from "./store";

const SESSION_KEY = "sv-wallet-session-v2";
const LEGACY_KEYS = ["sv-wallet-session-v1"];

export function readSessionMnemonic(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(SESSION_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function writeSessionMnemonic(mnemonic: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (mnemonic) sessionStorage.setItem(SESSION_KEY, mnemonic);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode — ignore */
  }
}

export function useSessionPersist() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Migrate / clean legacy keys
    try {
      for (const k of LEGACY_KEYS) sessionStorage.removeItem(k);
      // also clean any localStorage leftover from very old builds
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }

    // 2) Rehydrate mnemonic from sessionStorage if store is empty
    const current = useWalletStore.getState().mnemonic;
    if (!current) {
      const cached = readSessionMnemonic();
      if (cached) {
        useWalletStore.getState().unlock(cached);
      }
    }

    // 3) Mirror future store changes back to sessionStorage
    const unsub = useWalletStore.subscribe((state, prev) => {
      if (state.mnemonic === prev.mnemonic) return;
      writeSessionMnemonic(state.mnemonic);
    });

    return () => unsub();
  }, []);
}
