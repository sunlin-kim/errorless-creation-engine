import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { findAsset, fmtKrw, fmtNum, transactions } from "@/lib/wallet-data";
import { TxRow } from "@/components/wallet/TxRow";
import { ArrowLeft, Send, QrCode, ArrowLeftRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/asset/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const isMobile = useIsMobile();
  const asset = findAsset(id);
  if (!asset) {
    return (
      <AppShell title="자산을 찾을 수 없음">
        <Link to="/" className="text-primary text-sm">
          ← 대시보드로
        </Link>
      </AppShell>
    );
  }
  const value = asset.balance * asset.priceKrw;
  const positive = asset.change24h >= 0;
  const txs = transactions.filter((t) => t.asset.includes(asset.symbol));

  return (
    <AppShell title={asset.name} subtitle={`${asset.symbol} · ${asset.network}`}>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-4"
      >
        <ArrowLeft size={14} /> 대시보드
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-outline bg-surface p-6">
            <div className="flex items-center gap-4">
              <span
                className="h-14 w-14 rounded-full grid place-items-center text-white text-xl font-semibold"
                style={{ backgroundColor: asset.color }}
              >
                {asset.symbol[0]}
              </span>
              <div className="flex-1">
                <p className="text-sm text-on-surface-variant">보유 잔액</p>
                <p className="tnum text-3xl font-semibold">
                  {fmtNum(asset.balance, 6)} {asset.symbol}
                </p>
                <p className="tnum text-sm text-on-surface-variant">≈ {fmtKrw(value)}</p>
              </div>
              <div className={`text-right ${positive ? "text-success" : "text-destructive"}`}>
                <p className="tnum text-lg font-medium">
                  {positive ? "+" : ""}
                  {asset.change24h.toFixed(2)}%
                </p>
                <p className="text-[11px] text-on-surface-variant">24h</p>
              </div>
            </div>

            <FakeChart up={positive} />

            <div className="mt-5 grid grid-cols-3 gap-3">
              <ActionBtn to="/send" icon={Send} label="보내기" />
              <ActionBtn to="/receive" icon={QrCode} label="받기" />
              <ActionBtn to={isMobile ? "/wallet" : "/activity"} icon={ArrowLeftRight} label="스왑" />
            </div>
          </section>

          <section className="rounded-3xl border border-outline bg-surface p-5">
            <h2 className="text-base font-semibold mb-2">관련 거래</h2>
            <div className="divide-y divide-[color:var(--outline)]/40">
              {txs.length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  거래 내역이 없습니다.
                </p>
              )}
              {txs.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-outline bg-surface p-5 text-sm">
            <h3 className="font-semibold mb-3">자산 정보</h3>
            <Info label="네트워크" value={asset.network} />
            <Info label="현재가" value={fmtKrw(asset.priceKrw)} />
            <Info label="보유 가치" value={fmtKrw(value)} />
            <Info label="컨트랙트" value="0x…네이티브" mono />
          </section>
          <section className="rounded-3xl border border-outline bg-surface-container p-5 text-xs text-on-surface-variant">
            가격 정보는 참고용이며, 실제 거래소 가격과 다를 수 있습니다.
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline/40 last:border-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`text-right ${mono ? "tnum text-xs" : "tnum"} font-medium`}>{value}</span>
    </div>
  );
}

function ActionBtn({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      preload="intent"
      className="h-12 rounded-xl bg-primary-container text-on-primary-container font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

function FakeChart({ up }: { up: boolean }) {
  const pts: number[] = [];
  let s = 0.5;
  for (let i = 0; i < 40; i++) {
    s += (Math.sin(i * 0.7) + (up ? 0.06 : -0.04)) * 0.05;
    pts.push(Math.max(0.1, Math.min(0.9, s)));
  }
  const w = 600;
  const h = 140;
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${(1 - p) * h}`)
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const color = up ? "#10B981" : "#DC2626";
  return (
    <div className="mt-5 -mx-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cg)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
