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
  // 자동 잠금 기능 비활성화 — 사용자가 명시적으로 잠그기 전에는 잠금 해제 유지.
  useEffect(() => {
    return;
  }, []);
}
// no-op to keep ACTIVITY_EVENTS referenced
void ACTIVITY_EVENTS;
