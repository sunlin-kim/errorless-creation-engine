/**
 * 잠금 해제된 시드(mnemonic)는 **메모리에만** 보관한다.
 *
 * 이전 버전은 라우터 재마운트/HMR/언어 토글로 인한 잠금 화면 튕김을
 * 완화하기 위해 평문 mnemonic 을 sessionStorage 에 미러링했지만,
 * 이는 XSS·WebView 취약점·악성 확장·디버그 접근 시 시드 전체가
 * 탈취되는 치명적 보안 결함이다. (코덱스 감사 지적 #1)
 *
 * 따라서 sessionStorage 미러링을 완전히 제거하고, 본 훅은 과거 키를
 * 정리하는 일회성 마이그레이션만 수행한다. 새로고침 후 잠금 화면 복귀는
 * 비수탁 지갑의 정상 동작이다.
 */

import { useEffect } from "react";

const LEGACY_SESSION_KEYS = ["sv-wallet-session-v1"];

export function useSessionPersist() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      for (const k of LEGACY_SESSION_KEYS) {
        sessionStorage.removeItem(k);
      }
    } catch {
      /* private mode 등 — 무시 */
    }
  }, []);
}
