/**
 * 자동 잠금 훅 — 사용자 활동(마우스/키/터치)을 감시하고,
 * autoLockMinutes 동안 미사용 시 잠금. 탭이 다시 보일 때(visibilitychange)도
 * 동일하게 체크. autoLockMinutes <= 0 이면 비활성.
 */

import { useEffect } from "react";
import { useWalletStore } from "./store";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

const CHECK_INTERVAL_MS = 15_000;

export function useAutoLock() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const touch = () => useWalletStore.getState().touchActivity();

    const checkLock = () => {
      const { mnemonic, autoLockMinutes, lastActivity, lock } =
        useWalletStore.getState();
      if (!mnemonic) return;
      if (autoLockMinutes <= 0) return;
      if (Date.now() - lastActivity >= autoLockMinutes * 60_000) {
        lock();
      }
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, touch, { passive: true });
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkLock();
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
