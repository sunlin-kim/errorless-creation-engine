import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { useEffect, useState } from "react";
import { Copy, Check, ShieldCheck, KeyRound } from "lucide-react";
import { useWalletStore } from "@/lib/wallet/store";
import { deriveAddresses } from "@/lib/wallet/derive";
import { toast } from "sonner";

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
  } catch {}
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
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const navigate = useNavigate();
  const [sel, setSel] = useState<AssetId>("ETH");
  const [copied, setCopied] = useState(false);
  const [addrs, setAddrs] = useState<{
    eth: string;
    btc: string;
    bnb: string;
    sol: string;
  } | null>(null);

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
      <AppShell title="받기" subtitle="지갑 준비 중">
        <div className="max-w-xl mx-auto rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            지갑 정보를 아직 불러오지 못했거나 생성되지 않았습니다.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet/setup" })}
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
          >
            <KeyRound size={14} /> 지갑 설정
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
      toast.success(`${current.label} 주소가 복사되었습니다`);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("자동 복사 실패 — 주소를 길게 눌러 수동 복사하세요");
    }
  };

  return (
    <AppShell
      title="받기"
      subtitle={`체인을 선택하고 주소·QR을 공유하세요 · ${network === "mainnet" ? "메인넷" : "테스트넷"}`}
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
            {current.network} 호환 자산만 보내세요
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-surface-container p-4">
          <p className="text-xs text-on-surface-variant">
            내 {current.label} 주소
          </p>
          <p className="mt-1 break-all font-mono text-sm font-medium min-h-[1.25rem]">
            {address ?? "주소 생성 중..."}
          </p>
          <button
            onClick={copy}
            disabled={!address}
            className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "복사됨" : "주소 복사"}
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
 * 간단한 결정론적 QR 시각화 (실제 QR 코드 라이브러리 미사용).
 * 주소 자체는 위쪽 텍스트/복사 버튼으로 정확하게 전달됩니다.
 */
function QrCanvas({ value }: { value: string }) {
  const size = 25;
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  const cells: boolean[] = [];
  let s = h >>> 0 || 1;
  for (let i = 0; i < size * size; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    cells.push((s & 1) === 1);
  }
  const inFinder = (r: number, c: number) => {
    const f = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return f(0, 0) || f(0, size - 7) || f(size - 7, 0);
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: 220,
        height: 220,
      }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const finder = inFinder(r, c);
        let fill = on;
        if (finder) {
          const inSquare = (br: number, bc: number) => {
            const lr = r - br,
              lc = c - bc;
            return (
              lr === 0 ||
              lr === 6 ||
              lc === 0 ||
              lc === 6 ||
              (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
            );
          };
          fill =
            (r < 7 && c < 7 && inSquare(0, 0)) ||
            (r < 7 && c >= size - 7 && inSquare(0, size - 7)) ||
            (r >= size - 7 && c < 7 && inSquare(size - 7, 0));
        }
        return (
          <div
            key={i}
            style={{ backgroundColor: fill ? "#065F46" : "transparent" }}
          />
        );
      })}
    </div>
  );
}
