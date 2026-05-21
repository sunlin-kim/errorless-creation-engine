import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { deriveAddresses } from "@/lib/wallet/derive";
import { derivePrivateKeys } from "@/lib/wallet/keys";
import { getEndpoints } from "@/lib/wallet/networks";
import {
  sendEth,
  sendUsdt,
  sendBtc,
  sendBnb,
  sendSol,
  parseUnits,
} from "@/lib/wallet/send";
import { ArrowLeft, Send, AlertTriangle, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";

type Asset = "ETH" | "USDT" | "BTC" | "BNB" | "SOL";

export const Route = createFileRoute("/wallet/send")({
  component: SendPage,
});

function SendPage() {
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const navigate = useNavigate();
  const ep = useMemo(() => getEndpoints(network), [network]);

  const [asset, setAsset] = useState<Asset>("ETH");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [addrs, setAddrs] = useState<{
    eth: string;
    btc: string;
    bnb: string;
    sol: string;
  } | null>(null);
  const [txid, setTxid] = useState<string | null>(null);

  useEffect(() => {
    if (!mnemonic) return;
    deriveAddresses(mnemonic, network)
      .then((a) =>
        setAddrs({ eth: a.eth, btc: a.btc, bnb: a.bnb, sol: a.sol }),
      )
      .catch(() => toast.error("주소 파생 실패"));
  }, [mnemonic, network]);

  if (!mnemonic) {
    return (
      <AppShell title="송금" subtitle="잠금 해제 필요">
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <Lock size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            지갑이 잠겨 있습니다.
          </p>
          <Link
            to="/wallet/unlock"
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
          >
            잠금 해제
          </Link>
        </div>
      </AppShell>
    );
  }

  const fromAddress =
    asset === "BTC" ? addrs?.btc ?? "" : addrs?.eth ?? "";

  function validateAddress(): string | null {
    const v = to.trim();
    if (!v) return "받는 주소를 입력하세요";
    if (asset === "BTC") {
      const isMain = network === "mainnet";
      if (isMain && !/^(bc1|1|3)/.test(v)) return "유효한 BTC 주소가 아닙니다";
      if (!isMain && !/^(tb1|m|n|2)/.test(v))
        return "유효한 BTC 테스트넷 주소가 아닙니다";
    } else {
      if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return "유효한 EVM 주소가 아닙니다";
    }
    return null;
  }

  async function onSend() {
    const addrErr = validateAddress();
    if (addrErr) return toast.error(addrErr);
    try {
      const decimals = asset === "BTC" ? 8 : asset === "USDT" ? 6 : 18;
      parseUnits(amount, decimals); // 형식 검증
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : "금액 오류");
    }
    if (network === "mainnet") {
      const ok = confirm(
        `메인넷에서 ${amount} ${asset} 을(를) 다음 주소로 전송합니다:\n${to}\n\n` +
          "이 작업은 되돌릴 수 없습니다. 정말 진행하시겠습니까?",
      );
      if (!ok) return;
    }

    setBusy(true);
    setTxid(null);
    let priv: Uint8Array | null = null;
    let btcPub: Uint8Array | null = null;
    try {
      const keys = await derivePrivateKeys(mnemonic!, network);
      priv = asset === "BTC" ? keys.btcPriv : keys.ethPriv;
      btcPub = keys.btcPub;

      let id: string;
      if (asset === "ETH") {
        id = await sendEth(ep, fromAddress, to.trim(), amount, priv);
      } else if (asset === "USDT") {
        id = await sendUsdt(ep, fromAddress, to.trim(), amount, priv);
      } else {
        id = await sendBtc(ep, fromAddress, btcPub, to.trim(), amount, priv);
      }
      setTxid(id);
      toast.success("전송 완료");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "전송 실패");
    } finally {
      // 메모리에서 개인키 제거 시도
      if (priv) priv.fill(0);
      priv = null;
      btcPub = null;
      setBusy(false);
    }
  }

  const explorerUrl =
    txid && (asset === "BTC"
      ? `${ep.btcExplorer}/tx/${txid}`
      : `${ep.ethExplorer}/tx/${txid}`);

  const usdtUnavailable = asset === "USDT" && !ep.usdtContract;

  return (
    <AppShell title="송금" subtitle={`비수탁 · ${ep.label}`}>
      <div className="mx-auto max-w-xl space-y-5">
        <button
          onClick={() => navigate({ to: "/wallet" })}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={14} /> 지갑으로
        </button>

        <section className="rounded-3xl border border-outline bg-surface p-5 space-y-4">
          <div>
            <p className="text-xs text-on-surface-variant mb-2">자산 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {(["ETH", "USDT", "BTC"] as Asset[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAsset(a)}
                  className={`h-10 rounded-lg border text-xs font-semibold ${
                    asset === a
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {usdtUnavailable && (
              <p className="mt-2 text-[11px] text-amber-500">
                USDT는 메인넷에서만 전송할 수 있습니다.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">보내는 주소</label>
            <code className="block mt-1 text-[11px] font-mono bg-surface-container rounded-lg px-2.5 py-2 truncate">
              {fromAddress || "—"}
            </code>
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">받는 주소</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={asset === "BTC" ? (network === "mainnet" ? "bc1..." : "tb1...") : "0x..."}
              className="mt-1 w-full h-10 rounded-lg border border-outline bg-surface-container px-3 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">
              금액 ({asset})
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="mt-1 w-full h-10 rounded-lg border border-outline bg-surface-container px-3 text-sm font-mono"
            />
          </div>

          {network === "mainnet" && (
            <div className="flex gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                메인넷 전송은 즉시 확정되며 되돌릴 수 없습니다. 주소·금액을
                반드시 두 번 이상 확인하세요.
              </p>
            </div>
          )}

          <button
            onClick={onSend}
            disabled={busy || usdtUnavailable}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {busy ? "전송 중..." : "전송"}
          </button>

          {txid && explorerUrl && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold text-emerald-500">전송 완료</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline break-all"
              >
                {txid} <ExternalLink size={11} />
              </a>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
