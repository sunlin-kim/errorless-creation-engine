/**
 * 세션 영속화 정책: 평문 mnemonic/seed/private key는 어떤 Web Storage에도
 * 저장하지 않는다. 새로고침 시 다시 잠기는 것은 비수탁 지갑의 의도된
 * 보안 동작이며, unlock 상태는 메모리 Zustand에만 보관한다.
 *
 * 이 모듈의 유일한 역할은 과거 빌드가 남겼을 수 있는 legacy 평문 키를
 * 발견 즉시 삭제하는 마이그레이션이다.
 */

import { useEffect } from "react";

const LEGACY_KEYS = ["sv-wallet-session-v1", "sv-wallet-session-v2"];

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
}
