import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { useDerivedAddresses } from "@/lib/wallet/use-derived-addresses";
import { useWcStore } from "@/lib/wallet/wc/store";
import { getWalletKit, buildEip155Namespace } from "@/lib/wallet/wc/client";
import { handleSessionRequest } from "@/lib/wallet/wc/handlers";
import { isProjectIdConfigured, SUPPORTED_EIP155_CHAINS } from "@/lib/wallet/wc/config";
import { Link2, Unplug, ShieldAlert, Loader2, ExternalLink, Wallet, X, Check } from "lucide-react";
import { toast } from "sonner";

type ConnectSearch = { uri?: string };

export const Route = createFileRoute("/connect")({
  validateSearch: (s: Record<string, unknown>): ConnectSearch => ({
    uri: typeof s.uri === "string" ? s.uri : undefined,
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/connect" }) as ConnectSearch;
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const addrs = useDerivedAddresses();
  const evmAddress = addrs?.eth ?? "";

  const ready = useWcStore((s) => s.ready);
  const initError = useWcStore((s) => s.initError);
  const sessions = useWcStore((s) => s.sessions);
  const proposal = useWcStore((s) => s.proposal);
  const request = useWcStore((s) => s.request);

  const [uriInput, setUriInput] = useState("");
  const [pairing, setPairing] = useState(false);

  // ─── Init WalletKit on mount (browser only) ─────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    getWalletKit().catch(() => {
      /* error stored in wcStore.initError */
    });
  }, []);

  const pair = useCallback(
    async (uri: string) => {
      const trimmed = uri.trim();
      if (!trimmed.startsWith("wc:")) {
        toast.error("유효한 WalletConnect URI 가 아닙니다 (wc:... 로 시작)");
        return;
      }
      setPairing(true);
      try {
        const kit = await getWalletKit();
        await kit.pair({ uri: trimmed });
        setUriInput("");
        toast.success("연결 요청 수신됨 — 잠시 후 승인 창이 뜹니다");
      } catch (e) {
        toast.error(`Pairing 실패: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setPairing(false);
      }
    },
    [],
  );

  // ─── Deep link: /connect?uri=wc:... ─────────────────────────────────────
  useEffect(() => {
    if (search.uri && ready) {
      void pair(search.uri);
      // clear query so a reload doesn't re-pair
      navigate({ to: "/connect", search: {}, replace: true });
    }
  }, [search.uri, ready, pair, navigate]);

  return (
    <AppShell title="WalletConnect" subtitle="외부 dApp 연결 · 서명">
      <div className="px-5 lg:px-8 py-6 max-w-3xl space-y-6">
        {!isProjectIdConfigured() && (
          <Banner tone="warn" icon={<ShieldAlert size={16} />}>
            Reown Project ID 가 설정되지 않았습니다. <code>src/lib/wallet/wc/config.ts</code> 의
            <code> FALLBACK_PROJECT_ID</code> 를 발급받은 ID 로 교체하거나 <code>VITE_WC_PROJECT_ID</code>{" "}
            환경변수를 설정하세요.
          </Banner>
        )}
        {!mnemonic && (
          <Banner tone="warn" icon={<ShieldAlert size={16} />}>
            지갑이 잠겨 있습니다. 서명 요청을 받으려면{" "}
            <Link to="/wallet/unlock" className="underline">
              잠금 해제
            </Link>{" "}
            먼저 하세요.
          </Banner>
        )}
        {initError && (
          <Banner tone="danger" icon={<ShieldAlert size={16} />}>
            WalletKit 초기화 실패: {initError}
          </Banner>
        )}

        {/* URI 입력 */}
        <section className="rounded-2xl border border-outline bg-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={18} className="text-primary" />
            <h2 className="text-base font-semibold">WalletConnect URI 붙여넣기</h2>
          </div>
          <p className="text-xs text-on-surface-variant mb-3">
            dApp 의 "WalletConnect" 버튼을 누르면 보이는 <code>wc:</code> 로 시작하는 URI 를 복사해서 붙여넣으세요.
            모바일 앱에서는 <code>supervizion://wc?uri=...</code> 딥링크로 자동 진입합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={uriInput}
              onChange={(e) => setUriInput(e.target.value)}
              placeholder="wc:abc123...@2?relay-protocol=irn&symKey=..."
              className="flex-1 rounded-xl border border-outline bg-background px-3 py-2 text-sm font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => pair(uriInput)}
              disabled={!ready || pairing || !uriInput.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50 inline-flex items-center gap-2"
            >
              {pairing ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              연결
            </button>
          </div>
          {!ready && !initError && (
            <p className="text-xs text-on-surface-variant mt-2 inline-flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> WalletKit 초기화 중...
            </p>
          )}
        </section>

        {/* 활성 세션 */}
        <section className="rounded-2xl border border-outline bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              <h2 className="text-base font-semibold">연결된 dApp</h2>
            </div>
            <span className="text-xs text-on-surface-variant">{sessions.length}개</span>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">연결된 dApp 이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <SessionRow key={s.topic} session={s} />
              ))}
            </ul>
          )}
        </section>

        {/* 지원 정보 */}
        <section className="rounded-2xl border border-outline bg-surface-container p-4 text-xs text-on-surface-variant">
          <p className="font-medium text-on-surface mb-1">지원 체인</p>
          <p>Ethereum (1) · BNB Smart Chain (56) · BSC Testnet (97)</p>
          <p className="font-medium text-on-surface mt-2 mb-1">지원 메서드</p>
          <p>personal_sign · eth_signTypedData_v4 · eth_sendTransaction · wallet_switchEthereumChain</p>
        </section>
      </div>

      {proposal && (
        <ProposalDialog
          proposal={proposal}
          evmAddress={evmAddress}
          onApprove={async () => {
            if (!evmAddress) {
              toast.error("EVM 주소를 파생할 수 없습니다 (지갑 잠금 해제 필요)");
              return;
            }
            try {
              const kit = await getWalletKit();
              const requested = proposal.requestedChains.length
                ? proposal.requestedChains
                : [...SUPPORTED_EIP155_CHAINS];
              const namespaces = buildEip155Namespace(evmAddress, requested);
              await kit.approveSession({
                id: proposal.id,
                namespaces,
              });
              toast.success("연결 승인됨");
            } catch (e) {
              toast.error(`승인 실패: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
              useWcStore.getState().setProposal(null);
              const kit = await getWalletKit();
              const { refreshSessions } = await import("@/lib/wallet/wc/client");
              refreshSessions(kit);
            }
          }}
          onReject={async () => {
            try {
              const kit = await getWalletKit();
              await kit.rejectSession({
                id: proposal.id,
                reason: { code: 5000, message: "User rejected" },
              });
            } catch (e) {
              console.warn("[wc] reject failed", e);
            } finally {
              useWcStore.getState().setProposal(null);
            }
          }}
        />
      )}

      {request && (
        <RequestDialog
          request={request}
          canSign={!!mnemonic && !!evmAddress}
          onApprove={async () => {
            if (!mnemonic) {
              toast.error("지갑이 잠겨 있습니다");
              return;
            }
            const res = await handleSessionRequest({
              mnemonic,
              evmAddress,
              chainId: request.chainId,
              method: request.method,
              params: request.params,
            });
            try {
              const kit = await getWalletKit();
              await kit.respondSessionRequest({
                topic: request.topic,
                response: res.ok
                  ? { id: request.id, jsonrpc: "2.0", result: res.result }
                  : { id: request.id, jsonrpc: "2.0", error: res.error },
              });
              // chain switch 가 성공했으면 dApp 에게 chainChanged 이벤트를 emit
              // 해야 새 네트워크로 인식한다. (응답만으로는 wagmi/viem 계열
              // 클라이언트가 활성 체인을 갱신하지 않음.)
              if (
                res.ok &&
                (request.method === "wallet_switchEthereumChain" ||
                  request.method === "wallet_addEthereumChain") &&
                kit.emitSessionEvent
              ) {
                try {
                  const wanted = (request.params as [{ chainId?: string }])?.[0]?.chainId;
                  const wantedNum = wanted ? Number(BigInt(wanted)) : NaN;
                  if (wantedNum === 1 || wantedNum === 56 || wantedNum === 97) {
                    const caip2 = `eip155:${wantedNum}`;
                    await kit.emitSessionEvent({
                      topic: request.topic,
                      event: { name: "chainChanged", data: wantedNum },
                      chainId: caip2,
                    });
                  }
                } catch (e) {
                  console.warn("[wc] chainChanged emit failed", e);
                }
              }
              if (res.ok) toast.success(`${request.method} 완료`);
              else toast.error(`${request.method} 실패: ${res.error.message}`);
            } catch (e) {
              toast.error(`응답 전송 실패: ${e instanceof Error ? e.message : String(e)}`);
            } finally {

              useWcStore.getState().setRequest(null);
            }
          }}
          onReject={async () => {
            try {
              const kit = await getWalletKit();
              await kit.respondSessionRequest({
                topic: request.topic,
                response: {
                  id: request.id,
                  jsonrpc: "2.0",
                  error: { code: 5000, message: "User rejected" },
                },
              });
            } catch (e) {
              console.warn("[wc] reject request failed", e);
            } finally {
              useWcStore.getState().setRequest(null);
            }
          }}
        />
      )}
    </AppShell>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "warn" | "danger" | "info";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger"
      ? "border-error/40 bg-error/10 text-on-surface"
      : tone === "warn"
        ? "border-warning/40 bg-warning/10 text-on-surface"
        : "border-outline bg-surface text-on-surface";
  return (
    <div className={`rounded-xl border ${cls} px-4 py-3 text-sm flex items-start gap-2`}>
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SessionRow({
  session,
}: {
  session: { topic: string; name: string; url: string; icon?: string; chains: string[]; accounts: string[] };
}) {
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-outline bg-background px-3 py-2.5">
      {session.icon ? (
        <img src={session.icon} alt="" className="h-8 w-8 rounded-lg object-cover" />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-surface-container grid place-items-center text-xs font-semibold">
          {session.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{session.name}</div>
        <div className="text-xs text-on-surface-variant truncate">
          {session.url} · {session.chains.join(", ")}
        </div>
      </div>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            const kit = await getWalletKit();
            await kit.disconnectSession({
              topic: session.topic,
              reason: { code: 6000, message: "User disconnected" },
            });
            const { refreshSessions } = await import("@/lib/wallet/wc/client");
            refreshSessions(kit);
            toast.success("연결 끊김");
          } catch (e) {
            toast.error(`끊기 실패: ${e instanceof Error ? e.message : String(e)}`);
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="rounded-lg border border-outline px-2.5 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-surface-container disabled:opacity-50"
      >
        <Unplug size={12} /> 끊기
      </button>
    </li>
  );
}

function ProposalDialog({
  proposal,
  evmAddress,
  onApprove,
  onReject,
}: {
  proposal: NonNullable<ReturnType<typeof useWcStore.getState>["proposal"]>;
  evmAddress: string;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={() => onReject()}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {proposal.metadata.icons?.[0] && (
            <img src={proposal.metadata.icons[0]} alt="" className="h-12 w-12 rounded-xl" />
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">
              {proposal.metadata.name ?? "Unknown dApp"} 연결 요청
            </h3>
            <p className="text-xs text-on-surface-variant truncate">{proposal.metadata.url}</p>
          </div>
        </div>
        {proposal.metadata.description && (
          <p className="text-sm text-on-surface-variant">{proposal.metadata.description}</p>
        )}
        <div className="rounded-xl bg-surface-container p-3 text-xs space-y-1.5">
          <div>
            <span className="text-on-surface-variant">요청 체인: </span>
            <span className="font-mono">
              {proposal.requestedChains.length ? proposal.requestedChains.join(", ") : "(none)"}
            </span>
          </div>
          <div>
            <span className="text-on-surface-variant">요청 메서드: </span>
            <span className="font-mono">{proposal.requestedMethods.join(", ") || "(none)"}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">노출될 주소: </span>
            <span className="font-mono break-all">{evmAddress || "(잠금 해제 필요)"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onReject()}
            className="flex-1 rounded-xl border border-outline px-4 py-2.5 text-sm font-medium hover:bg-surface-container inline-flex items-center justify-center gap-1.5"
          >
            <X size={14} /> 거절
          </button>
          <button
            disabled={!evmAddress || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onApprove();
              } finally {
                setBusy(false);
              }
            }}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 승인
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RequestDialog({
  request,
  canSign,
  onApprove,
  onReject,
}: {
  request: NonNullable<ReturnType<typeof useWcStore.getState>["request"]>;
  canSign: boolean;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => describeRequest(request.method, request.params), [request]);
  return (
    <Modal onClose={() => onReject()}>
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">
            서명 요청 — <span className="font-mono text-sm">{request.method}</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {request.peerName ?? "Unknown dApp"} · {request.chainId}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container p-3 text-xs max-h-64 overflow-auto">
          <pre className="whitespace-pre-wrap break-all font-mono">{summary}</pre>
        </div>
        {!canSign && (
          <Banner tone="warn" icon={<ShieldAlert size={14} />}>
            지갑이 잠겨 있어 서명할 수 없습니다. <Link to="/wallet/unlock" className="underline">잠금 해제</Link>
          </Banner>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onReject()}
            className="flex-1 rounded-xl border border-outline px-4 py-2.5 text-sm font-medium hover:bg-surface-container inline-flex items-center justify-center gap-1.5"
          >
            <X size={14} /> 거절
          </button>
          <button
            disabled={!canSign || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onApprove();
              } finally {
                setBusy(false);
              }
            }}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-on-primary disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 승인
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-outline bg-surface p-5 shadow-xl">
        {children}
      </div>
    </div>
  );
}

function describeRequest(method: string, params: unknown): string {
  try {
    if (method === "personal_sign" || method === "eth_sign") {
      const arr = params as unknown[];
      const hex = typeof arr[0] === "string" && (arr[0] as string).startsWith("0x") ? arr[0] : arr[1];
      let text = "";
      if (typeof hex === "string" && hex.startsWith("0x")) {
        try {
          const bytes = new Uint8Array((hex.length - 2) / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt((hex as string).slice(2 + i * 2, 4 + i * 2), 16);
          }
          text = new TextDecoder().decode(bytes);
        } catch {
          text = hex as string;
        }
      } else {
        text = String(hex);
      }
      return `메시지:\n${text}`;
    }
    if (method.startsWith("eth_signTypedData")) {
      const arr = params as unknown[];
      const td = arr[1];
      return typeof td === "string" ? td : JSON.stringify(td, null, 2);
    }
    if (method === "eth_sendTransaction") {
      const tx = (params as unknown[])[0];
      return JSON.stringify(tx, null, 2);
    }
    return JSON.stringify(params, null, 2);
  } catch (e) {
    return `[describe failed: ${e instanceof Error ? e.message : String(e)}]`;
  }
}
