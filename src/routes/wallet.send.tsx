import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";
import { derivePrivateKeys } from "@/lib/wallet/keys";
import { getEndpoints } from "@/lib/wallet/networks";
import { useDerivedAddresses } from "@/lib/wallet/use-derived-addresses";
import {
  sendEth,
  sendUsdt,
  sendBtc,
  sendBnb,
  sendSol,
  parseUnits,
} from "@/lib/wallet/send";
import { ArrowLeft, Send, AlertTriangle, ExternalLink, KeyRound } from "lucide-react";
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
      if (isMain && !/^(bc1|1|3)/.test(v)) return tr("wsend.errBtcAddr");
      if (!isMain && !/^(tb1|m|n|2)/.test(v)) return tr("wsend.errBtcTestAddr");
    } else if (asset === "SOL") {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return tr("wsend.errSolAddr");
    } else {
      if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return tr("wsend.errEvmAddr");
    }
    return null;
  }

  function decimalsFor(a: Asset): number {
    if (a === "BTC") return 8;
    if (a === "USDT") return 6;
    if (a === "SOL") return 9;
    return 18;
  }

  async function onSend() {
    const addrErr = validateAddress();
    if (addrErr) return toast.error(addrErr);
    try {
      parseUnits(amount, decimalsFor(asset));
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : tr("wsend.errAmount"));
    }
    if (network === "mainnet") {
      const ok = confirm(tr("wsend.confirmMainnet", { amount, asset, to }));
      if (!ok) return;
    }

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
            : keys.ethPriv; // ETH / USDT / BNB

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

          {network === "mainnet" && (
            <div className="flex gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {tr("wsend.mainnetWarn")}
              </p>
            </div>
          )}

          <button
            onClick={onSend}
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
    </AppShell>
  );
}
