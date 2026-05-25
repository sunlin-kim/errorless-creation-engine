/**
 * Reown WalletKit 싱글톤 + 이벤트 → zustand store 동기화.
 *
 * 브라우저 전용. 모든 import 는 dynamic — SSR 번들에 절대 포함되지 않게.
 * `getWalletKit()` 는 최초 호출 시 init 하고 같은 인스턴스를 재사용한다.
 */

import { useWcStore, type WcSessionSummary } from "./store";
import {
  WC_METADATA,
  WC_PROJECT_ID,
  SUPPORTED_EIP155_CHAINS,
  SUPPORTED_METHODS,
  SUPPORTED_EVENTS,
  isProjectIdConfigured,
} from "./config";

type AnyWalletKit = {
  on: (event: string, cb: (e: unknown) => void) => void;
  off?: (event: string, cb: (e: unknown) => void) => void;
  pair: (args: { uri: string }) => Promise<unknown>;
  approveSession: (args: unknown) => Promise<unknown>;
  rejectSession: (args: unknown) => Promise<unknown>;
  respondSessionRequest: (args: unknown) => Promise<unknown>;
  disconnectSession: (args: { topic: string; reason: { code: number; message: string } }) => Promise<unknown>;
  getActiveSessions: () => Record<string, unknown>;
  emitSessionEvent?: (args: unknown) => Promise<unknown>;
  updateSession?: (args: unknown) => Promise<unknown>;
};

let kitPromise: Promise<AnyWalletKit> | null = null;

function summarizeSessions(active: Record<string, unknown>): WcSessionSummary[] {
  return Object.values(active).map((s) => {
    const session = s as {
      topic: string;
      expiry: number;
      peer?: { metadata?: { name?: string; url?: string; icons?: string[] } };
      namespaces?: Record<string, { accounts?: string[]; chains?: string[] }>;
    };
    const ns = session.namespaces?.eip155;
    return {
      topic: session.topic,
      name: session.peer?.metadata?.name ?? "Unknown dApp",
      url: session.peer?.metadata?.url ?? "",
      icon: session.peer?.metadata?.icons?.[0],
      chains: ns?.chains ?? [],
      accounts: ns?.accounts ?? [],
      expiry: session.expiry,
    };
  });
}

function refreshSessions(kit: AnyWalletKit) {
  try {
    useWcStore.getState().setSessions(summarizeSessions(kit.getActiveSessions()));
  } catch (e) {
    console.warn("[wc] refreshSessions failed", e);
  }
}

export async function getWalletKit(): Promise<AnyWalletKit> {
  if (typeof window === "undefined") {
    throw new Error("WalletKit is browser-only");
  }
  if (!isProjectIdConfigured()) {
    throw new Error(
      "Reown Project ID not configured. Set VITE_WC_PROJECT_ID or edit src/lib/wallet/wc/config.ts",
    );
  }
  if (kitPromise) return kitPromise;

  kitPromise = (async () => {
    const [{ Core }, walletKitMod] = await Promise.all([
      import("@walletconnect/core"),
      import("@reown/walletkit"),
    ]);
    const WalletKit =
      (walletKitMod as { WalletKit?: { init: (args: unknown) => Promise<AnyWalletKit> } })
        .WalletKit ??
      (walletKitMod as unknown as { default: { init: (args: unknown) => Promise<AnyWalletKit> } })
        .default;
    if (!WalletKit || typeof WalletKit.init !== "function") {
      throw new Error("WalletKit module load failed");
    }
    const core = new Core({ projectId: WC_PROJECT_ID });
    const kit = await WalletKit.init({ core, metadata: WC_METADATA });

    // ─── Event wiring ─────────────────────────────────────────────────────
    kit.on("session_proposal", (raw: unknown) => {
      try {
        const ev = raw as {
          id: number;
          params: {
            pairingTopic?: string;
            proposer: { metadata: { name?: string; description?: string; url?: string; icons?: string[] } };
            requiredNamespaces?: Record<string, { chains?: string[]; methods?: string[] }>;
            optionalNamespaces?: Record<string, { chains?: string[]; methods?: string[] }>;
          };
        };
        const req = ev.params.requiredNamespaces?.eip155;
        const opt = ev.params.optionalNamespaces?.eip155;
        const chains = [...(req?.chains ?? []), ...(opt?.chains ?? [])];
        const methods = [...(req?.methods ?? []), ...(opt?.methods ?? [])];
        useWcStore.getState().setProposal({
          id: ev.id,
          topic: ev.params.pairingTopic,
          metadata: ev.params.proposer.metadata,
          requestedChains: Array.from(new Set(chains)),
          requestedMethods: Array.from(new Set(methods)),
          raw: ev,
        });
      } catch (e) {
        console.error("[wc] session_proposal parse failed", e);
      }
    });

    kit.on("session_request", (raw: unknown) => {
      try {
        const ev = raw as {
          id: number;
          topic: string;
          params: { chainId: string; request: { method: string; params: unknown } };
        };
        const sessions = kit.getActiveSessions();
        const session = sessions[ev.topic] as
          | { peer?: { metadata?: { name?: string; url?: string } } }
          | undefined;
        useWcStore.getState().setRequest({
          id: ev.id,
          topic: ev.topic,
          chainId: ev.params.chainId,
          method: ev.params.request.method,
          params: ev.params.request.params,
          peerName: session?.peer?.metadata?.name,
          peerUrl: session?.peer?.metadata?.url,
        });
      } catch (e) {
        console.error("[wc] session_request parse failed", e);
      }
    });

    kit.on("session_delete", () => refreshSessions(kit));
    kit.on("session_expire", () => refreshSessions(kit));

    refreshSessions(kit);
    useWcStore.getState().setReady(true);
    console.info("[wc] WalletKit ready", { sessions: Object.keys(kit.getActiveSessions()).length });
    return kit;
  })().catch((err) => {
    kitPromise = null;
    const msg = err instanceof Error ? err.message : String(err);
    useWcStore.getState().setReady(false, msg);
    console.error("[wc] init failed", err);
    throw err;
  });

  return kitPromise;
}

/** Build the EIP-155 namespace for approveSession from a single EOA address. */
export function buildEip155Namespace(address: string, requestedChains: string[]) {
  // Intersect requested chains with our supported set (fall back to all supported)
  const requested = requestedChains.filter((c) => SUPPORTED_EIP155_CHAINS.includes(c as (typeof SUPPORTED_EIP155_CHAINS)[number]));
  const chains = requested.length ? requested : [...SUPPORTED_EIP155_CHAINS];
  return {
    eip155: {
      chains,
      methods: [...SUPPORTED_METHODS],
      events: [...SUPPORTED_EVENTS],
      accounts: chains.map((c) => `${c}:${address}`),
    },
  };
}

export { refreshSessions };
