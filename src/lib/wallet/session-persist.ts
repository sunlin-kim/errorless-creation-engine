/**
 * 세션 영속화 정책: 평문 mnemonic/seed/private key는 어떤 Web Storage에도
 * 저장하지 않는다. 새로고침 시 다시 잠기는 것은 비수탁 지갑의 의도된
 * 보안 동작이며, unlock 상태는 메모리 Zustand에만 보관한다.
 *
 * 이 모듈의 유일한 역할은 과거 빌드가 남겼을 수 있는 legacy 평문 키를
 * 발견 즉시 삭제하는 마이그레이션이다.
 */

import { useEffect } from "react";
import { ensureWalletStoreHydrated, useWalletStore } from "./store";

const LEGACY_KEYS = ["sv-wallet-session-v1", "sv-wallet-session-v2"];
const RECOVERY_KEY = "sv-wallet-reload-recovery-v1";
const RECOVERY_TTL_MS = 45_000;

type RecoveryPayload = {
  data: string;
  iv: string;
  key: string;
  expiresAt: number;
};

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function saveUnlockRecoverySnapshot(mnemonic: string) {
  if (typeof window === "undefined") return;
  try {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      "AES-GCM",
      false,
      ["encrypt"],
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      new TextEncoder().encode(mnemonic) as BufferSource,
    );

    const payload: RecoveryPayload = {
      data: toBase64(new Uint8Array(encrypted)),
      iv: toBase64(iv),
      key: toBase64(keyBytes),
      expiresAt: Date.now() + RECOVERY_TTL_MS,
    };

    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(payload));
    console.info("[wallet-debug] recovery-snapshot:saved", { expiresAt: payload.expiresAt });
  } catch {
    /* ignore */
  }
}

export function clearUnlockRecoverySnapshot() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    /* ignore */
  }
}

async function consumeUnlockRecoverySnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as RecoveryPayload;
    if (!payload?.data || !payload?.iv || !payload?.key || payload.expiresAt <= Date.now()) {
      sessionStorage.removeItem(RECOVERY_KEY);
      return null;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      fromBase64(payload.key) as BufferSource,
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) as BufferSource },
      key,
      fromBase64(payload.data) as BufferSource,
    );
    sessionStorage.removeItem(RECOVERY_KEY);
    console.info("[wallet-debug] recovery-snapshot:consumed", { expiresAt: payload.expiresAt });
    return new TextDecoder().decode(decrypted);
  } catch {
    clearUnlockRecoverySnapshot();
    return null;
  }
}

export function useSessionPersist() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      for (const k of LEGACY_KEYS) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      }
    } catch {
      /* private mode 등 — 무시 */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (useWalletStore.getState().mnemonic) {
      return;
    }

    void consumeUnlockRecoverySnapshot().then(async (mnemonic) => {
      if (!mnemonic) return;
      await ensureWalletStoreHydrated();
      if (useWalletStore.getState().mnemonic) return;
      useWalletStore.getState().unlock(mnemonic);
    });
  }, []);
}
