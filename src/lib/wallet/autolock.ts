/**
 * 자동 잠금 훅 — 사용자 활동(마우스/키/터치)을 감시하고,
 * autoLockMinutes 동안 미사용 시 잠금. 또한 탭이 숨겨진 후 같은 시간이
 * 경과하면 visibilitychange 에서도 잠금.
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

export function useAutoLock() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let throttleTimer: number | null = null;
    const onActivity = () => {
      if (throttleTimer !== null) return;
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
        useWalletStore.getState().touchActivity();
      }, 1000);
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      const { mnemonic, autoLockMinutes, lastActivity, lock } =
        useWalletStore.getState();
      if (!mnemonic || autoLockMinutes <= 0) return;
      const idleMs = Date.now() - lastActivity;
      if (idleMs >= autoLockMinutes * 60_000) {
        lock();
      }
    }, 15_000);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const { mnemonic, autoLockMinutes, lastActivity, lock } =
        useWalletStore.getState();
      if (!mnemonic || autoLockMinutes <= 0) return;
      if (Date.now() - lastActivity >= autoLockMinutes * 60_000) lock();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      if (throttleTimer !== null) window.clearTimeout(throttleTimer);
    };
  }, []);
}
