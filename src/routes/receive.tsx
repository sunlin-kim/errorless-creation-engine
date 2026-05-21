import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { useState } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";
import { type Network } from "@/lib/wallet-data";

export const Route = createFileRoute("/receive")({
  component: ReceivePage,
});

const networks: { id: Network; address: string }[] = [
  { id: "Ethereum", address: "0x4F8e1aC9bd23F5C7Da82c1b6E8a4F021c98A21cA" },
  { id: "BSC", address: "0x4F8e1aC9bd23F5C7Da82c1b6E8a4F021c98A21cA" },
  { id: "Polygon", address: "0x4F8e1aC9bd23F5C7Da82c1b6E8a4F021c98A21cA" },
  { id: "Solana", address: "8KvR2x7yL9pHsT3qN6mE5dW1zXcVbA4uJ2fG0iY8hQ7p" },
  { id: "Bitcoin", address: "bc1qx2y7r4p8m3n5k6j2h9w8e7t6r5q4y3u2i1o0p9a" },
];

function ReceivePage() {
  const [net, setNet] = useState<Network>("Ethereum");
  const [copied, setCopied] = useState(false);
  const current = networks.find((n) => n.id === net)!;

  const copy = async () => {
    await navigator.clipboard.writeText(current.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell title="받기" subtitle="네트워크를 선택하고 주소 또는 QR을 공유하세요.">
      <div className="max-w-xl mx-auto rounded-3xl border border-outline bg-surface p-6">
        <div className="flex flex-wrap gap-2">
          {networks.map((n) => (
            <button
              key={n.id}
              onClick={() => setNet(n.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                net === n.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-outline text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {n.id}
            </button>
          ))}
        </div>

        <div className="mt-6 grid place-items-center">
          <div className="rounded-3xl bg-white p-4 border border-outline brand-glow">
            <QrFake value={current.address} />
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            {net} 네트워크 호환 토큰만 보내세요
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-surface-container p-4">
          <p className="text-xs text-on-surface-variant">내 지갑 주소</p>
          <p className="mt-1 break-all tnum text-sm font-medium">{current.address}</p>
          <button
            onClick={copy}
            className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:opacity-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "복사됨" : "주소 복사"}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-primary-container text-on-primary-container text-xs">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          <p>
            잘못된 네트워크로 받은 자산은 복구가 어렵습니다. 송신 측 거래소·지갑이
            {" "}<strong>{net}</strong> 네트워크를 지원하는지 확인하세요.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

/** Deterministic fake QR (pure CSS grid) — not a real QR code, just visual placeholder. */
function QrFake({ value }: { value: string }) {
  const size = 25;
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  const cells: boolean[] = [];
  let s = h >>> 0 || 1;
  for (let i = 0; i < size * size; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    cells.push((s & 1) === 1);
  }
  // finder patterns
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
            const lr = r - br, lc = c - bc;
            return (
              lr === 0 || lr === 6 || lc === 0 || lc === 6 ||
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
            style={{
              backgroundColor: fill ? "#065F46" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}
