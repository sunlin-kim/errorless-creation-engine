/**
 * WalletConnect 런타임 상태 — 진행 중인 proposal / request 와 활성 세션 목록.
 * 모든 상태는 메모리. 영속 세션은 WalletKit 내부 스토리지(IndexedDB)에 자동 보존.
 */

import { create } from "zustand";

export interface WcPendingProposal {
  id: number;
  topic?: string;
  metadata: {
    name?: string;
    description?: string;
    url?: string;
    icons?: string[];
  };
  /** 요청된 체인 (eip155:N) */
  requestedChains: string[];
  /** 요청된 메서드 */
  requestedMethods: string[];
  /** 원본 proposal — approveSession 호출 시 그대로 전달 */
  raw: unknown;
}

export interface WcPendingRequest {
  id: number;
  topic: string;
  chainId: string; // eip155:N
  method: string;
  params: unknown;
  /** 표시용 dApp 메타 (세션에서 lookup) */
  peerName?: string;
  peerUrl?: string;
}

export interface WcSessionSummary {
  topic: string;
  name: string;
  url: string;
  icon?: string;
  chains: string[];
  accounts: string[];
  expiry: number;
}

interface WcState {
  ready: boolean;
  initError: string | null;
  sessions: WcSessionSummary[];
  proposal: WcPendingProposal | null;
  request: WcPendingRequest | null;
  setReady: (ready: boolean, err?: string | null) => void;
  setSessions: (s: WcSessionSummary[]) => void;
  setProposal: (p: WcPendingProposal | null) => void;
  setRequest: (r: WcPendingRequest | null) => void;
}

export const useWcStore = create<WcState>((set) => ({
  ready: false,
  initError: null,
  sessions: [],
  proposal: null,
  request: null,
  setReady: (ready, err = null) => set({ ready, initError: err }),
  setSessions: (sessions) => set({ sessions }),
  setProposal: (proposal) => set({ proposal }),
  setRequest: (request) => set({ request }),
}));
