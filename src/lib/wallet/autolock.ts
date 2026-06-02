/**
 * 자동 잠금 훅 — 사용자 활동(마우스/키/터치)을 감시하고,
 * autoLockMinutes 동안 미사용 시 잠금. 탭이 다시 보일 때(visibilitychange)도
 * 동일하게 체크. autoLockMinutes <= 0 이면 비활성.
 */

import { useEffect } from "react";
import { hasWalletStoreHydrated, useWalletStore } from "./store";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

const CHECK_INTERVAL_MS = 15_000;
const UNLOCK_STABILIZE_MS = 5_000;

export function useAutoLock() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const touch = () => {
      const state = useWalletStore.getState();
      if (!state.mnemonic) return;
      state.touchActivity();
    };

    const checkLock = () => {
      if (!hasWalletStoreHydrated()) return;

      const { mnemonic, autoLockMinutes, autoLockGraceUntil, lastActivity, lock } = useWalletStore.getState();
      const now = Date.now();
      if (!mnemonic) return;
      if (autoLockMinutes <= 0) return;
      if (now < autoLockGraceUntil) return;
      if (now - lastActivity < UNLOCK_STABILIZE_MS) return;
      if (now - lastActivity >= autoLockMinutes * 60_000) {
        console.warn("[wallet] auto-lock triggered", {
          autoLockMinutes,
          lastActivity,
          now,
        });
        lock();
      }
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, touch, { passive: true });
    }
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      touch();
      window.setTimeout(checkLock, UNLOCK_STABILIZE_MS);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(checkLock, CHECK_INTERVAL_MS);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, touch);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, []);
}
