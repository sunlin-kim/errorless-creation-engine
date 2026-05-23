import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";
import { derivePrivateKeys } from "@/lib/wallet/keys";
import { getEndpoints } from "@/lib/wallet/networks";
import { useDerivedAddresses } from "@/lib/wallet/use-derived-addresses";
import { toChecksumAddress } from "@/lib/wallet/derive";
import { loadVault } from "@/lib/wallet/vault";
import { decryptString } from "@/lib/wallet/crypto";
import * as btc from "@scure/btc-signer";
import { base58 } from "@scure/base";
import {
  sendEth,
  sendUsdt,
  sendBtc,
  sendBnb,
  sendSol,
  parseUnits,
  estimateEthFee,
  estimateBtcFee,
} from "@/lib/wallet/send";
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Asset = "ETH" | "USDT" | "BTC" | "BNB" | "SOL";

export const Route = createFileRoute("/wallet/send")({
  component: SendPage,
});

function SendPage() {
  const tr = useT();
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const navigate = useNavigate();
  const ep = useMemo(() => getEndpoints(network), [network]);
  const addrs = useDerivedAddresses();

  const [asset, setAsset] = useState<Asset>("ETH");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);

  // 수수료 미리보기
  const [feePreview, setFeePreview] = useState<string>("");
  const [feeBusy, setFeeBusy] = useState(false);

  // 비밀번호 재확인 모달
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  if (!mnemonic) {
    return (
      <AppShell title={tr("wsend.title")} subtitle={tr("wsend.subtitleWaiting")}>
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            {tr("activity.needWallet")}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet/setup" })}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
          >
            <KeyRound size={14} /> {tr("wallet.setup")}
          </button>
        </div>
      </AppShell>
    );
  }

  const fromAddress =
    asset === "BTC"
      ? addrs?.btc ?? ""
      : asset === "SOL"
        ? addrs?.sol ?? ""
        : asset === "BNB"
          ? addrs?.bnb ?? ""
          : addrs?.eth ?? "";

  function validateAddress(): string | null {
    const v = to.trim();
    if (!v) return tr("wsend.errAddrRequired");
    if (asset === "BTC") {
      const isMain = network === "mainnet";
      const net = isMain ? btc.NETWORK : btc.TEST_NETWORK;
      try {
        const decoded = btc.Address(net).decode(v);
        if (!decoded) return tr("wsend.errBtcAddr");
      } catch {
        return isMain ? tr("wsend.errBtcAddr") : tr("wsend.errBtcTestAddr");
      }
    } else if (asset === "SOL") {
      try {
        const bytes = base58.decode(v);
        if (bytes.length !== 32) return tr("wsend.errSolAddr");
      } catch {
        return tr("wsend.errSolAddr");
      }
    } else {
      // EVM (ETH/USDT/BNB)
      if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return tr("wsend.errEvmAddr");
      const hasUpper = /[A-F]/.test(v);
      const hasLower = /[a-f]/.test(v);
      // 혼합 대소문자면 EIP-55 체크섬 강제
      if (hasUpper && hasLower) {
        if (toChecksumAddress(v) !== v) return tr("wsend.errEvmAddr");
      }
    }
    return null;
  }

  function decimalsFor(a: Asset): number {
    if (a === "BTC") return 8;
    if (a === "USDT") return 6;
    if (a === "SOL") return 9;
    return 18;
  }

  // 수수료 미리보기 자동 추정
  useEffect(() => {
    setFeePreview("");
    if (!amount || validateAddress() !== null) return;
    let cancelled = false;
    (async () => {
      setFeeBusy(true);
      try {
        if (asset === "BTC") {
          const fpb = await estimateBtcFee(ep);
          if (!cancelled) setFeePreview(`~${fpb} sat/vB`);
        } else if (asset === "SOL") {
          if (!cancelled) setFeePreview("~0.000005 SOL");
        } else {
          const valueWei =
            asset === "USDT" ? 0n : parseUnits(amount, decimalsFor(asset));
          const fee = await estimateEthFee(
            ep,
            fromAddress,
            asset === "USDT" ? ep.usdtContract ?? to.trim() : to.trim(),
            valueWei,
          );
          const ethWhole = fee.totalFeeWei / 10n ** 18n;
          const ethRem = fee.totalFeeWei % 10n ** 18n;
          const ethStr = `${ethWhole}.${ethRem.toString().padStart(18, "0").slice(0, 6)}`;
          if (!cancelled)
            setFeePreview(`~${ethStr} ${asset === "BNB" ? "BNB" : "ETH"}`);
        }
      } catch {
        if (!cancelled) setFeePreview("");
      } finally {
        if (!cancelled) setFeeBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, to, asset, network]);

  function openPasswordPrompt() {
    const addrErr = validateAddress();
    if (addrErr) return toast.error(addrErr);
    try {
      parseUnits(amount, decimalsFor(asset));
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : tr("wsend.errAmount"));
    }
    setPw("");
    setPwOpen(true);
  }

  async function confirmAndSend() {
    setPwBusy(true);
    try {
      const v = await loadVault();
      if (!v) throw new Error("NO_VAULT");
      // 비밀번호 검증 (잘못된 비밀번호면 WRONG_PASSWORD throw)
      await decryptString(v.encryptedMnemonic, pw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(msg === "WRONG_PASSWORD" ? tr("settings.wrongPw") : tr("settings.decryptFail"));
      setPwBusy(false);
      return;
    }
    setPwBusy(false);
    setPwOpen(false);
    setPw("");
    await onSend();
  }

  async function onSend() {
    setBusy(true);
    setTxid(null);
    let priv: Uint8Array | null = null;
    let btcPub: Uint8Array | null = null;
    let solPriv: Uint8Array | null = null;
    try {
      const keys = await derivePrivateKeys(mnemonic!, network);
      btcPub = keys.btcPub;
      solPriv = keys.solPriv;
      priv =
        asset === "BTC"
          ? keys.btcPriv
          : asset === "SOL"
            ? keys.solPriv
            : keys.ethPriv;

      let id: string;
      if (asset === "ETH") {
        id = await sendEth(ep, fromAddress, to.trim(), amount, priv);
      } else if (asset === "USDT") {
        id = await sendUsdt(ep, fromAddress, to.trim(), amount, priv);
      } else if (asset === "BNB") {
        id = await sendBnb(ep, fromAddress, to.trim(), amount, priv);
      } else if (asset === "SOL") {
        id = await sendSol(ep, fromAddress, to.trim(), amount, priv);
      } else {
        id = await sendBtc(ep, fromAddress, btcPub, to.trim(), amount, priv);
      }
      setTxid(id);
      toast.success(tr("wsend.success"));
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : tr("wsend.errFailed"));
    } finally {
      if (priv) priv.fill(0);
      if (solPriv && solPriv !== priv) solPriv.fill(0);
      priv = null;
      btcPub = null;
      solPriv = null;
      setBusy(false);
    }
  }

  const explorerUrl =
    txid &&
    (asset === "BTC"
      ? `${ep.btcExplorer}/tx/${txid}`
      : asset === "SOL"
        ? `${ep.solExplorer}${ep.solExplorer.includes("?") ? "&" : "/"}tx/${txid}`
        : asset === "BNB"
          ? `${ep.bscExplorer}/tx/${txid}`
          : `${ep.ethExplorer}/tx/${txid}`);

  const usdtUnavailable = asset === "USDT" && !ep.usdtContract;

  return (
    <AppShell title={tr("wsend.title")} subtitle={tr("wsend.subtitle", { label: ep.label })}>
      <div className="mx-auto max-w-xl space-y-5">
        <button
          onClick={() => navigate({ to: "/wallet" })}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={14} /> {tr("wsend.back")}
        </button>

        <section className="rounded-3xl border border-outline bg-surface p-5 space-y-4">
          <div>
            <p className="text-xs text-on-surface-variant mb-2">{tr("wsend.assetPick")}</p>
            <div className="grid grid-cols-5 gap-2">
              {(["ETH", "USDT", "BTC", "BNB", "SOL"] as Asset[]).map((a) => (
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
                {tr("wsend.usdtMainnetOnly")}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">{tr("wsend.fromAddr")}</label>
            <code className="block mt-1 text-[11px] font-mono bg-surface-container rounded-lg px-2.5 py-2 truncate">
              {fromAddress || "—"}
            </code>
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">{tr("wsend.toAddr")}</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={
                asset === "BTC"
                  ? network === "mainnet"
                    ? "bc1..."
                    : "tb1..."
                  : asset === "SOL"
                    ? "Solana address (base58)"
                    : "0x..."
              }
              className="mt-1 w-full h-10 rounded-lg border border-outline bg-surface-container px-3 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-on-surface-variant">
              {tr("wsend.amount", { asset })}
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="mt-1 w-full h-10 rounded-lg border border-outline bg-surface-container px-3 text-sm font-mono"
            />
          </div>

          {/* 수수료 미리보기 */}
          <div className="rounded-lg bg-surface-container p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">예상 네트워크 수수료</span>
              <span className="font-mono">{feeBusy ? "계산 중…" : feePreview || "—"}</span>
            </div>
            {amount && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">보낼 금액</span>
                <span className="font-mono">
                  {amount} {asset}
                </span>
              </div>
            )}
          </div>

          {network === "mainnet" && (
            <div className="flex gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {tr("wsend.mainnetWarn")}
              </p>
            </div>
          )}

          <button
            onClick={openPasswordPrompt}
            disabled={busy || usdtUnavailable}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {busy ? tr("wsend.sending") : tr("wsend.send")}
          </button>

          {txid && explorerUrl && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold text-emerald-500">{tr("wsend.success")}</p>
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

      {pwOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-outline bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">송금 확인</h3>
              <button
                onClick={() => {
                  setPwOpen(false);
                  setPw("");
                }}
                className="p-1 rounded-md hover:bg-surface-container"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 rounded-lg bg-surface-container p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">자산</span>
                <span className="font-semibold">{asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">금액</span>
                <span className="font-mono">
                  {amount} {asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">예상 수수료</span>
                <span className="font-mono">{feePreview || "—"}</span>
              </div>
              <div>
                <p className="text-on-surface-variant mt-1">받는 주소</p>
                <p className="font-mono break-all text-[11px] mt-0.5">{to.trim()}</p>
              </div>
            </div>
            <label className="mt-3 block text-xs text-on-surface-variant">
              지갑 비밀번호
            </label>
            <input
              type="password"
              value={pw}
              autoFocus
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pw && !pwBusy) confirmAndSend();
              }}
              className="mt-1 w-full h-10 rounded-lg border border-outline bg-background px-3 text-sm focus:border-primary outline-none"
              placeholder="비밀번호 입력"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setPwOpen(false);
                  setPw("");
                }}
                className="flex-1 h-10 rounded-lg border border-outline text-xs"
              >
                취소
              </button>
              <button
                onClick={confirmAndSend}
                disabled={!pw || pwBusy}
                className="flex-1 h-10 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40"
              >
                {pwBusy ? "확인 중…" : "확인 후 송금"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
