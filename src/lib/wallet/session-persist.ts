/**
 * 잠금 해제된 지갑 상태(mnemonic, 파생 주소, 마지막 활동시각)를
 * **같은 탭이 살아있는 동안에만** sessionStorage 에 보관한다.
 *
 * 동기:
 *  - mnemonic 은 보안상 localStorage 에 평문 저장하지 않는다.
 *  - 하지만 단일 탭 내에서 라우터 재마운트, SSR 재수화, 언어/통화 토글,
 *    Vite HMR 등으로 zustand 메모리 상태가 초기화될 때마다 사용자가
 *    잠금 화면으로 튕기는 문제가 있었다.
 *  - sessionStorage 는 탭이 닫히면 자동 폐기되므로 잠금 UX 와 충돌하지
 *    않으면서 "탭이 살아있는 동안 = 잠금 유지" 라는 자연스러운 흐름을
 *    제공한다.
 *  - autoLock 이 0 이 아닌 한, 마지막 활동시각 기준으로 만료된 세션은
 *    복원하지 않고 즉시 lock() 한다.
 *
 * XSS 노출 면적은 메모리에 둘 때와 사실상 동일하다(이미 동일 origin).
 */

import { useEffect } from "react";
import { useWalletStore } from "./store";

const SESSION_KEY = "sv-wallet-session-v1";

type Persisted = {
  mnemonic: string | null;
  derivedAddresses: {
    mainnet: { eth: string; btc: string; bnb: string; sol: string } | null;
    testnet: { eth: string; btc: string; bnb: string; sol: string } | null;
  };
  lastActivity: number;
};

function safeGet(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function safeSet(value: Persisted | null) {
  if (typeof window === "undefined") return;
  try {
    if (!value || !value.mnemonic) {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    }
  } catch {
    /* private mode etc — silently ignore */
  }
}

export function useSessionPersist() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) 복원: 탭 살아있는 동안 보관된 시드를 메모리로 다시 올린다.
    const saved = safeGet();
    if (saved?.mnemonic) {
      const { autoLockMinutes } = useWalletStore.getState();
      const expired =
        autoLockMinutes > 0 &&
        Date.now() - saved.lastActivity >= autoLockMinutes * 60_000;

      if (expired) {
        safeSet(null);
      } else {
        useWalletStore.setState({
          mnemonic: saved.mnemonic,
          derivedAddresses: saved.derivedAddresses ?? {
            mainnet: null,
            testnet: null,
          },
          lastActivity: saved.lastActivity || Date.now(),
        });
      }
    }

    // 2) 미러링: 시드/주소/활동시각 변화를 sessionStorage 에 반영.
    const unsub = useWalletStore.subscribe((state, prev) => {
      if (
        state.mnemonic === prev.mnemonic &&
        state.derivedAddresses === prev.derivedAddresses &&
        state.lastActivity === prev.lastActivity
      ) {
        return;
      }
      safeSet({
        mnemonic: state.mnemonic,
        derivedAddresses: state.derivedAddresses,
        lastActivity: state.lastActivity,
      });
    });

    return () => {
      unsub();
    };
  }, []);
}
