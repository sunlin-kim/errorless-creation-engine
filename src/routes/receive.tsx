import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { useEffect, useRef, useState } from "react";
import { Copy, Check, ShieldCheck, KeyRound } from "lucide-react";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { useDerivedAddresses } from "@/lib/wallet/use-derived-addresses";

export const Route = createFileRoute("/receive")({
  component: ReceivePage,
});

type AssetId = "ETH" | "USDT" | "BNB" | "SOL" | "BTC";

interface AssetInfo {
  id: AssetId;
  label: string;
  network: string;
  note: string;
}

const ASSETS: AssetInfo[] = [
  {
    id: "ETH",
    label: "ETH",
    network: "Ethereum",
    note: "Ethereum 메인넷의 ETH·ERC-20 토큰만 보내세요.",
  },
  {
    id: "USDT",
    label: "USDT",
    network: "Ethereum (ERC-20)",
    note: "ERC-20 USDT 전용 주소입니다. 다른 체인의 USDT를 보내면 손실됩니다.",
  },
  {
    id: "BNB",
    label: "BNB",
    network: "BNB Smart Chain (BEP-20)",
    note: "BSC(BEP-20) 네트워크 자산만 보내세요. ERC-20을 보내면 분실됩니다.",
  },
  {
    id: "SOL",
    label: "SOL",
    network: "Solana",
    note: "Solana 메인넷 자산만 보내세요.",
  },
  {
    id: "BTC",
    label: "BTC",
    network: "Bitcoin (Native SegWit)",
    note: "BTC 메인넷 전용. Lightning·다른 체인 BTC는 받을 수 없습니다.",
  },
];

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function ReceivePage() {
  const t = useT();
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const navigate = useNavigate();
  const [sel, setSel] = useState<AssetId>("ETH");
  const [copied, setCopied] = useState(false);
  const addrs = useDerivedAddresses();

  if (!mnemonic) {
    return (
      <AppShell title={t("receive.title")} subtitle={t("receive.subtitleWaiting")}>
        <div className="max-w-xl mx-auto rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">{t("activity.needWallet")}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet/setup" })}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
          >
            <KeyRound size={14} /> {t("wallet.setup")}
          </button>
        </div>
      </AppShell>
    );
  }

  const current = ASSETS.find((a) => a.id === sel)!;
  const address =
    sel === "BTC"
      ? addrs?.btc
      : sel === "SOL"
        ? addrs?.sol
        : sel === "BNB"
          ? addrs?.bnb
          : addrs?.eth; // ETH/USDT는 같은 EVM 주소

  const copy = async () => {
    if (!address) return;
    const ok = await copyText(address);
    if (ok) {
      setCopied(true);
      toast.success(t("wallet.addrCopied", { sym: current.label }));
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error(t("receive.copyFail"));
    }
  };

  return (
    <AppShell
      title={t("receive.title")}
      subtitle={t("receive.subtitle", {
        mode: network === "mainnet" ? t("settings.mainnet") : t("settings.testnet"),
      })}
    >
      <div className="max-w-xl mx-auto rounded-3xl border border-outline bg-surface p-6">
        <div className="flex flex-wrap gap-2">
          {ASSETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setSel(a.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sel === a.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-outline text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid place-items-center">
          <div className="rounded-3xl bg-white p-4 border border-outline brand-glow">
            <QrCanvas value={address ?? ""} />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            {t("receive.compatNote", { network: current.network })}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-surface-container p-4">
          <p className="text-xs text-on-surface-variant">
            {t("receive.myAddr", { label: current.label })}
          </p>
          <p className="mt-1 break-all font-mono text-sm font-medium min-h-[1.25rem]">
            {address ?? t("receive.generating")}
          </p>
          <button
            onClick={copy}
            disabled={!address}
            className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? t("receive.copied") : t("receive.copy")}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-primary-container text-on-primary-container text-xs">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          <p>{current.note}</p>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * 실제 QR 코드 — `qrcode` 라이브러리로 주소를 인코딩하여 스캐너 호환 보장.
 */
function QrCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    let cancelled = false;
    (async () => {
      const QR = (await import("qrcode")).default;
      if (cancelled) return;
      try {
        await QR.toCanvas(canvas, value, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#065F46", light: "#ffffff" },
        });
      } catch {
        // 무시 — 잘못된 입력 시 빈 캔버스
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return <canvas ref={canvasRef} className="h-[220px] w-[220px]" aria-label="받기 주소 QR" />;
}
