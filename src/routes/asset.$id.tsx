/**
 * 자산 상세 — 실잔액·실시세·온체인 거래내역.
 *
 * 이전 버전은 `@/lib/wallet-data` 의 mock(`findAsset`, `transactions`) 과
 * `FakeChart` 로 가짜 수치를 표시해 사용자 오인 위험이 있었다.
 * 이제 `wallet.index.tsx` 와 동일한 패턴(balance.ts + getPrices, staleTime 30s)
 * 으로 실데이터만 표시하고, 거래내역은 `history.ts` 를 자산 심볼로 필터링한다.
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wallet/AppShell";
import { TxStatusBadge } from "@/components/wallet/TxStatusBadge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWalletStore } from "@/lib/wallet/store";
import { useDerivedAddresses } from "@/lib/wallet/use-derived-addresses";
import { getEndpoints } from "@/lib/wallet/networks";
import {
  getEthBalance,
  getUsdtBalance,
  getBtcBalance,
  getBnbBalance,
  getSolBalance,
  getDuckyBalance,
  getPrices,
  toFiat,
  formatFiat,
  type AssetBalance,
} from "@/lib/wallet/balance";
import { getAllHistory, type HistoryItem } from "@/lib/wallet/history";
import { ArrowLeft, Send, QrCode, ArrowLeftRight, KeyRound } from "lucide-react";

type Symbol = "BTC" | "ETH" | "USDT" | "BNB" | "SOL" | "DUCKY";

const SUPPORTED: Record<
  Symbol,
  { name: string; networkLabel: string; color: string }
> = {
  BTC: { name: "Bitcoin", networkLabel: "Bitcoin", color: "#F7931A" },
  ETH: { name: "Ethereum", networkLabel: "Ethereum", color: "#627EEA" },
  USDT: { name: "Tether USD (ERC-20)", networkLabel: "Ethereum", color: "#26A17B" },
  BNB: { name: "BNB Smart Chain", networkLabel: "BSC", color: "#F3BA2F" },
  SOL: { name: "Solana", networkLabel: "Solana", color: "#9945FF" },
  DUCKY: { name: "DuckyDuck (SPL)", networkLabel: "Solana", color: "#FFD93D" },
};

function isSymbol(x: string): x is Symbol {
  return x in SUPPORTED;
}

export const Route = createFileRoute("/asset/$id")({
  component: AssetDetail,
  notFoundComponent: () => (
    <AppShell title="자산을 찾을 수 없음">
      <Link to="/wallet" className="text-primary text-sm">
        ← 지갑으로
      </Link>
    </AppShell>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <AppShell title="자산을 불러오지 못했습니다">
        <p className="text-sm text-on-surface-variant">{error.message}</p>
        <button
          onClick={() => {
            reset();
            router.invalidate();
          }}
          className="mt-3 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
        >
          다시 시도
        </button>
      </AppShell>
    );
  },
});

function formatBalance(b: AssetBalance | null | undefined): string {
  return b ? b.formatted : "—";
}

function AssetDetail() {
  const { id } = Route.useParams();
  const isMobile = useIsMobile();
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const currency = useWalletStore((s) => s.currency);
  const addrs = useDerivedAddresses();
  const ep = useMemo(() => getEndpoints(network), [network]);

  const idUpper = id.toUpperCase();
  const validSymbol = isSymbol(idUpper);
  // 잘못된 심볼이어도 hooks 순서를 유지하기 위해 BTC 로 폴백
  const symbol: Symbol = validSymbol ? idUpper : "BTC";
  const meta = SUPPORTED[symbol];

  const balancesQ = useQuery({
    enabled: !!addrs && !!mnemonic && validSymbol,
    queryKey: ["asset", symbol, network, currency, addrs?.eth, addrs?.btc, addrs?.sol, addrs?.bnb],
    queryFn: async () => {
      if (!addrs) throw new Error("주소를 파생할 수 없습니다");
      let balance: AssetBalance | null = null;
      switch (symbol) {
        case "ETH":
          balance = await getEthBalance(ep, addrs.eth);
          break;
        case "USDT":
          balance = await getUsdtBalance(ep, addrs.eth);
          break;
        case "BTC":
          balance = await getBtcBalance(ep, addrs.btc);
          break;
        case "BNB":
          balance = await getBnbBalance(ep, addrs.bnb);
          break;
        case "SOL":
          balance = await getSolBalance(ep, addrs.sol);
          break;
        case "DUCKY":
          balance = await getDuckyBalance(ep, addrs.sol);
          break;
      }
      const prices = await getPrices(currency);
      return { balance, prices };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const historyQ = useQuery({
    enabled: !!addrs && !!mnemonic && validSymbol,
    queryKey: ["history", network, addrs?.eth, addrs?.btc],
    queryFn: async () => {
      if (!addrs) return [] as HistoryItem[];
      return getAllHistory(ep, addrs.eth, addrs.btc);
    },
    staleTime: 60_000,
  });

  const txs = useMemo(() => {
    const all = historyQ.data ?? [];
    const target = symbol === "DUCKY" || symbol === "BNB" || symbol === "SOL" ? null : symbol;
    if (!target) return [];
    return all.filter((t) => t.asset === target).slice(0, 20);
  }, [historyQ.data, symbol]);

  if (!validSymbol) {
    return (
      <AppShell title="지원하지 않는 자산" subtitle={id}>
        <Link to="/wallet" className="text-primary text-sm">
          ← 지갑으로
        </Link>
      </AppShell>
    );
  }

  if (!mnemonic) {
    return (
      <AppShell title={meta.name} subtitle="지갑 잠금">
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            잔액을 보려면 지갑을 잠금 해제하세요.
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

  const price = balancesQ.data?.prices.prices[symbol] ?? 0;
  const change24h = balancesQ.data?.prices.changes24h[symbol] ?? 0;
  const positive = change24h >= 0;
  const fiatValue = balancesQ.data?.balance
    ? toFiat(balancesQ.data.balance, balancesQ.data.prices.prices)
    : 0;


  const addressForExplorer =
    symbol === "BTC"
      ? addrs?.btc
      : symbol === "BNB"
        ? addrs?.bnb
        : symbol === "SOL" || symbol === "DUCKY"
          ? addrs?.sol
          : addrs?.eth;
  const explorer =
    symbol === "BTC"
      ? `${ep.btcExplorer}/address/${addressForExplorer ?? ""}`
      : symbol === "BNB"
        ? `${ep.bscExplorer}/address/${addressForExplorer ?? ""}`
        : symbol === "SOL" || symbol === "DUCKY"
          ? `${ep.solExplorer}${ep.solExplorer.includes("?") ? "&" : "/"}address/${addressForExplorer ?? ""}`
          : `${ep.ethExplorer}/address/${addressForExplorer ?? ""}`;

  return (
    <AppShell title={meta.name} subtitle={`${symbol} · ${meta.networkLabel}`}>
      <Link
        to="/wallet"
        className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-4"
      >
        <ArrowLeft size={14} /> 지갑으로
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-outline bg-surface p-6">
            <div className="flex items-center gap-4">
              <span
                className="h-14 w-14 rounded-full grid place-items-center text-white text-xl font-semibold"
                style={{ backgroundColor: meta.color }}
              >
                {symbol[0]}
              </span>
              <div className="flex-1">
                <p className="text-sm text-on-surface-variant">보유 잔액</p>
                <p className="tnum text-3xl font-semibold">
                  {balancesQ.isPending ? "—" : formatBalance(balancesQ.data?.balance)} {symbol}
                </p>
                <p className="tnum text-sm text-on-surface-variant">
                  ≈ {balancesQ.isPending ? "—" : formatFiat(fiatValue, currency)}
                </p>
              </div>
              <div className={`text-right ${positive ? "text-success" : "text-destructive"}`}>
                <p className="tnum text-lg font-medium">
                  {positive ? "+" : ""}
                  {change24h.toFixed(2)}%
                </p>
                <p className="text-[11px] text-on-surface-variant">24h</p>
              </div>
            </div>

            {balancesQ.isError && (
              <p className="mt-4 text-xs text-destructive">
                잔액 조회 실패: {(balancesQ.error as Error).message}
              </p>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3">
              <ActionBtn to="/wallet/send" icon={Send} label="보내기" />
              <ActionBtn to="/receive" icon={QrCode} label="받기" />
              <ActionBtn
                to={isMobile ? "/wallet" : "/activity"}
                icon={ArrowLeftRight}
                label="활동"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-outline bg-surface p-5">
            <h2 className="text-base font-semibold mb-2">관련 거래</h2>
            <div className="divide-y divide-[color:var(--outline)]/40">
              {historyQ.isPending && (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  불러오는 중…
                </p>
              )}
              {!historyQ.isPending && txs.length === 0 && (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  거래 내역이 없습니다.
                </p>
              )}
              {txs.map((t) => (
                <HistoryRow key={t.id} item={t} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-outline bg-surface p-5 text-sm">
            <h3 className="font-semibold mb-3">자산 정보</h3>
            <Info label="네트워크" value={meta.networkLabel} />
            <Info label="현재가" value={price ? formatFiat(price, currency) : "—"} />
            <Info label="보유 가치" value={formatFiat(fiatValue, currency)} />
            <Info
              label="주소"
              value={addressForExplorer ? shorten(addressForExplorer) : "—"}
              mono
            />
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs text-primary hover:underline"
            >
              익스플로러에서 보기 →
            </a>
          </section>
          <section className="rounded-3xl border border-outline bg-surface-container p-5 text-xs text-on-surface-variant leading-relaxed">
            시세는 외부 가격 피드(CoinGecko) 기반이며, 실제 거래소 가격과 차이가 있을 수
            있습니다. 차트는 신뢰할 수 있는 가격 시계열이 확보되기 전까지 표시하지
            않습니다.
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const Icon = item.direction === "in" ? ArrowDownLeft : ArrowUpRight;
  const sign = item.direction === "in" ? "+" : "-";
  const time = new Date(item.timestamp).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <a
      href={item.explorerUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-colors"
    >
      <span className="h-10 w-10 rounded-full grid place-items-center bg-primary-container text-on-primary-container">
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-on-surface">
            {item.direction === "in" ? "받음" : "보냄"}
          </p>
          <TxStatusBadge status={item.status} />
        </div>
        <p className="text-xs text-on-surface-variant truncate tnum">
          {item.counterparty} · {item.network}
        </p>
      </div>
      <div className="text-right">
        <p className="tnum text-sm font-medium">
          {sign}
          {item.amount} {item.asset}
        </p>
        <p className="text-[11px] text-on-surface-variant tnum">{time}</p>
      </div>
    </a>
  );
}


function shorten(addr: string): string {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 8) + "…" + addr.slice(-6);
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
