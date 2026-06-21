/**
 * 세션 영속화 정책: 평문 mnemonic/seed/private key 도, 그것을 복호화할 수
 * 있는 키 자료도 어떤 Web Storage 에도 저장하지 않는다.
 *
 * 새로고침 시 지갑이 다시 잠기는 것은 비수탁 지갑의 의도된 보안 동작이며,
 * unlock 상태는 메모리 Zustand 에만 보관한다.
 *
 * 과거 빌드는 sessionStorage 에 (ciphertext + iv + raw AES key) 를 함께
 * 저장하는 "reload recovery snapshot" 을 두었는데, 같은 origin XSS 가
 * 시드를 그대로 복호화할 수 있어 암호화가 사실상 무의미했다. 그래서 이
 * 모듈은 더 이상 어떤 스냅샷도 만들지 않고, 발견되는 즉시 삭제한다.
 */

import { useEffect } from "react";

const LEGACY_KEYS = [
  "sv-wallet-session-v1",
  "sv-wallet-session-v2",
  "sv-wallet-reload-recovery-v1",
];

/**
 * @deprecated 의도적으로 no-op. 평문 mnemonic 을 복호화할 수 있는 어떤
 * 자료도 Web Storage 에 저장하지 않는다. 호출부 호환을 위해 시그니처만 유지.
 */
export async function saveUnlockRecoverySnapshot(_mnemonic: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("sv-wallet-reload-recovery-v1");
  } catch {
    /* ignore */
  }
}

export function clearUnlockRecoverySnapshot() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("sv-wallet-reload-recovery-v1");
  } catch {
    /* ignore */
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
}
