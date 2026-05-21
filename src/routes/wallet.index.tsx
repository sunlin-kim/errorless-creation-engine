import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wallet/AppShell";
import { QuickActions } from "@/components/wallet/QuickActions";
import { useWalletStore } from "@/lib/wallet/store";
import { deriveAddresses } from "@/lib/wallet/derive";
import { getEndpoints } from "@/lib/wallet/networks";
import {
  getEthBalance,
  getBtcBalance,
  getUsdtBalance,
  getBnbBalance,
  getSolBalance,
  getPrices,
  toFiat,
  formatFiat,
  type AssetBalance,
} from "@/lib/wallet/balance";
import {
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/")({
  component: WalletPage,
});

function WalletPage() {
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const setNetwork = useWalletStore((s) => s.setNetwork);
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);

  useEffect(() => {
    import("@/lib/wallet/vault").then(({ hasVault }) =>
      hasVault().then(setVaultExists),
    );
  }, []);

  if (!mnemonic) {
    const hasExisting = vaultExists === true;
    return (
      <AppShell title="내 지갑" subtitle={hasExisting ? "지갑이 잠겨 있습니다" : "지갑을 만들거나 복구하세요"}>
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            {hasExisting
              ? "이 기기의 지갑을 사용하려면 비밀번호로 잠금을 해제하세요."
              : "이 기기에 아직 지갑이 없습니다. 새로 만들거나 시드로 복구할 수 있습니다."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {hasExisting ? (
              <>
                <Link
                  to="/wallet/unlock"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                >
                  <KeyRound size={14} /> 잠금 해제
                </Link>
                <Link
                  to="/wallet/setup"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline text-xs font-semibold"
                >
                  지갑 관리
                </Link>
              </>
            ) : (
              <Link
                to="/wallet/setup"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
              >
                <KeyRound size={14} /> 지갑 설정
              </Link>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return <WalletInner mnemonic={mnemonic} network={network} setNetwork={setNetwork} />;
}

type Net = "testnet" | "mainnet";

function WalletInner({
  mnemonic,
  network,
  setNetwork,
}: {
  mnemonic: string;
  network: Net;
  setNetwork: (n: Net) => void;
}) {
  const currency = useWalletStore((s) => s.currency);
  const ep = useMemo(() => getEndpoints(network), [network]);
  const [addrs, setAddrs] = useState<{
    eth: string;
    btc: string;
    bnb: string;
    sol: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    deriveAddresses(mnemonic, network)
      .then((a) => {
        if (!cancelled)
          setAddrs({ eth: a.eth, btc: a.btc, bnb: a.bnb, sol: a.sol });
      })
      .catch((e) => {
        console.error(e);
        toast.error("주소 파생 실패");
      });
    return () => {
      cancelled = true;
    };
  }, [mnemonic, network]);

  const balancesQ = useQuery({
    enabled: !!addrs,
    queryKey: ["balances", network, currency, addrs?.eth, addrs?.btc, addrs?.sol],
    queryFn: async () => {
      if (!addrs) throw new Error("no addr");
      const [eth, btc, usdt, bnb, sol, prices] = await Promise.all([
        getEthBalance(ep, addrs.eth).catch((e) => {
          console.warn("eth", e);
          return null;
        }),
        getBtcBalance(ep, addrs.btc).catch((e) => {
          console.warn("btc", e);
          return null;
        }),
        getUsdtBalance(ep, addrs.eth).catch((e) => {
          console.warn("usdt", e);
          return null;
        }),
        getBnbBalance(ep, addrs.bnb).catch((e) => {
          console.warn("bnb", e);
          return null;
        }),
        getSolBalance(ep, addrs.sol).catch((e) => {
          console.warn("sol", e);
          return null;
        }),
        getPrices(currency),
      ]);
      return { eth, btc, usdt, bnb, sol, prices };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const totals = useMemo(() => {
    const d = balancesQ.data;
    if (!d) return { total: 0, change: 0 };
    let total = 0;
    let prev = 0;
    const acc = (b: AssetBalance | null, p: number, ch: number) => {
      if (!b || !p) return;
      const v = toFiat(b, d.prices.prices);
      total += v;
      prev += v / (1 + ch / 100);
    };
    acc(d.eth, d.prices.prices.ETH, d.prices.changes24h.ETH);
    acc(d.btc, d.prices.prices.BTC, d.prices.changes24h.BTC);
    acc(d.usdt, d.prices.prices.USDT, d.prices.changes24h.USDT);
    acc(d.bnb, d.prices.prices.BNB, d.prices.changes24h.BNB);
    acc(d.sol, d.prices.prices.SOL, d.prices.changes24h.SOL);
    const change = prev > 0 ? ((total - prev) / prev) * 100 : 0;
    return { total, change };
  }, [balancesQ.data]);

  const items = useMemo(() => {
    const d = balancesQ.data;
    const list: Array<{
      symbol: "BTC" | "ETH" | "USDT" | "BNB" | "SOL";
      name: string;
      networkLabel: string;
      balance: AssetBalance | null;
      priceKrw: number;
      change24h: number;
      address: string | undefined;
      explorer: string;
      color: string;
      show: boolean;
    }> = [
      {
        symbol: "BTC",
        name: network === "mainnet" ? "Bitcoin" : "Bitcoin Testnet",
        networkLabel: "Bitcoin",
        balance: d?.btc ?? null,
        priceKrw: d?.prices.prices.BTC ?? 0,
        change24h: d?.prices.changes24h.BTC ?? 0,
        address: addrs?.btc,
        explorer: `${ep.btcExplorer}/address/${addrs?.btc ?? ""}`,
        color: "#F7931A",
        show: true,
      },
      {
        symbol: "ETH",
        name: network === "mainnet" ? "Ethereum" : "Sepolia ETH",
        networkLabel: "Ethereum",
        balance: d?.eth ?? null,
        priceKrw: d?.prices.prices.ETH ?? 0,
        change24h: d?.prices.changes24h.ETH ?? 0,
        address: addrs?.eth,
        explorer: `${ep.ethExplorer}/address/${addrs?.eth ?? ""}`,
        color: "#627EEA",
        show: true,
      },
      {
        symbol: "USDT",
        name: "Tether USD (ERC-20)",
        networkLabel: "Ethereum",
        balance: d?.usdt ?? null,
        priceKrw: d?.prices.prices.USDT ?? 0,
        change24h: d?.prices.changes24h.USDT ?? 0,
        address: addrs?.eth,
        explorer: `${ep.ethExplorer}/token/${ep.usdtContract ?? ""}?a=${addrs?.eth ?? ""}`,
        color: "#26A17B",
        show: !!ep.usdtContract,
      },
      {
        symbol: "BNB",
        name: network === "mainnet" ? "BNB Smart Chain" : "BSC Testnet",
        networkLabel: "BSC",
        balance: d?.bnb ?? null,
        priceKrw: d?.prices.prices.BNB ?? 0,
        change24h: d?.prices.changes24h.BNB ?? 0,
        address: addrs?.bnb,
        explorer: `${ep.bscExplorer}/address/${addrs?.bnb ?? ""}`,
        color: "#F3BA2F",
        show: true,
      },
      {
        symbol: "SOL",
        name: network === "mainnet" ? "Solana" : "Solana Devnet",
        networkLabel: "Solana",
        balance: d?.sol ?? null,
        priceKrw: d?.prices.prices.SOL ?? 0,
        change24h: d?.prices.changes24h.SOL ?? 0,
        address: addrs?.sol,
        explorer: `${ep.solExplorer}${ep.solExplorer.includes("?") ? "&" : "/"}address/${addrs?.sol ?? ""}`,
        color: "#9945FF",
        show: true,
      },
    ];
    return list.filter((i) => i.show);
  }, [balancesQ.data, addrs, network, ep]);

  return (
    <AppShell title="내 지갑" subtitle={`비수탁 · ${ep.label} · 실시간 시세`}>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          

          <LiveBalanceCard
            total={totals.total}
            change={totals.change}
            ethAddr={addrs?.eth}
            chains={items.length}
            loading={balancesQ.isPending}
            isFetching={balancesQ.isFetching}
            onRefresh={() => balancesQ.refetch()}
            network={network}
            setNetwork={setNetwork}
          />

          <QuickActions />

          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">보유 자산</h2>
              <span className="text-xs text-on-surface-variant tnum">
                {items.length}개 · {network === "mainnet" ? "메인넷" : "테스트넷"}
              </span>
            </header>
            <div className="divide-y divide-[color:var(--outline)]/40">
              {items.map((it) => (
                <LiveAssetRow key={it.symbol} item={it} loading={balancesQ.isPending} />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-on-surface-variant text-center">
              잔액은 온체인 RPC·mempool.space, 시세는 CoinGecko에서 실시간 조회됩니다.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="mb-3">
              <h2 className="text-base font-semibold">받기 주소</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                체인별 입금 주소 (HD 파생)
              </p>
            </header>
            <div className="space-y-2">
              {items.map((it) => (
                <AddressLine key={it.symbol} item={it} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-outline bg-surface p-5 text-xs text-on-surface-variant leading-relaxed">
            <p>
              <span className="font-semibold text-on-surface">참고</span> — 현재
              지원 자산은 BTC, ETH, USDT(ERC-20)입니다. 추가 체인(SOL, MATIC 등)은
              주소 파생 모듈이 확장되면 자동으로 노출됩니다.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function LiveBalanceCard({
  total,
  change,
  ethAddr,
  chains,
  loading,
  isFetching,
  onRefresh,
  network,
  setNetwork,
}: {
  total: number;
  change: number;
  ethAddr: string | undefined;
  chains: number;
  loading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  network: Net;
  setNetwork: (n: Net) => void;
}) {
  const currency = useWalletStore((s) => s.currency);
  const [hidden, setHidden] = useState(false);
  const positive = change >= 0;
  const shortAddr = ethAddr
    ? `${ethAddr.slice(0, 6)}…${ethAddr.slice(-4)}`
    : "—";

  return (
    <div className="relative overflow-hidden rounded-3xl brand-gradient brand-glow text-white p-7">
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[color:var(--tertiary)]/40 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.25em] text-white/70 uppercase">
            Total Balance · 총 자산 (실시간)
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tnum text-4xl md:text-5xl font-semibold">
              {hidden ? (currency === "KRW" ? "₩ ••••••••" : "$ ••••••••") : loading ? "—" : formatFiat(total, currency)}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm bg-white/15 px-2.5 py-1 rounded-full backdrop-blur">
            <TrendingUp size={14} className={positive ? "" : "rotate-180"} />
            <span className="tnum">
              {positive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
            <span className="text-white/70">24h</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NetworkToggle value={network} onChange={setNetwork} />
          <button
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="새로고침"
            className="h-9 w-9 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setHidden((h) => !h)}
            aria-label="잔액 숨기기"
            className="h-9 w-9 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="relative mt-7 grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "지갑 주소 (ETH)", value: shortAddr },
          { label: "활성 자산", value: `${chains} chains` },
          { label: "모드", value: network === "mainnet" ? "Mainnet" : "Testnet" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-white/10 backdrop-blur px-3 py-2.5"
          >
            <p className="text-white/60">{s.label}</p>
            <p className="mt-1 font-medium tnum truncate">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveAssetRow({
  item,
  loading,
}: {
  item: {
    symbol: "BTC" | "ETH" | "USDT" | "BNB" | "SOL";
    name: string;
    networkLabel: string;
    balance: AssetBalance | null;
    priceKrw: number;
    change24h: number;
    color: string;
  };
  loading: boolean;
}) {
  const currency = useWalletStore((s) => s.currency);
  const positive = item.change24h >= 0;
  const fiatValue =
    item.balance && item.priceKrw
      ? toFiat(item.balance, { [item.symbol]: item.priceKrw } as never)
      : 0;
  return (
    <div className="flex items-center gap-4 p-3">
      <span
        className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-white text-sm font-semibold"
        style={{ backgroundColor: item.color }}
      >
        {item.symbol[0]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-on-surface truncate">{item.name}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {item.networkLabel}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant tnum font-mono">
          {loading || !item.balance ? "—" : item.balance.formatted} {item.symbol}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium tnum text-on-surface">
          {item.balance && item.priceKrw ? formatFiat(krw) : "—"}
        </p>
        <p
          className={`text-xs tnum ${
            positive ? "text-success" : "text-destructive"
          }`}
        >
          {item.priceKrw
            ? `${positive ? "+" : ""}${item.change24h.toFixed(2)}%`
            : "—"}
        </p>
      </div>
    </div>
  );
}

function AddressLine({
  item,
}: {
  item: {
    symbol: "BTC" | "ETH" | "USDT" | "BNB" | "SOL";
    networkLabel: string;
    address: string | undefined;
    explorer: string;
  };
}) {
  const copy = () => {
    if (!item.address) return;
    navigator.clipboard.writeText(item.address);
    toast.success(`${item.symbol} 주소가 복사되었습니다`);
  };
  return (
    <div className="rounded-lg bg-surface-container px-2.5 py-2">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="font-semibold">{item.symbol}</span>
        <span className="text-on-surface-variant">{item.networkLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] font-mono truncate">
          {item.address ?? "—"}
        </code>
        <button
          onClick={copy}
          className="h-7 w-7 grid place-items-center rounded hover:bg-surface text-on-surface-variant"
          title="복사"
        >
          <Copy size={12} />
        </button>
        {item.address && (
          <a
            href={item.explorer}
            target="_blank"
            rel="noreferrer"
            className="h-7 w-7 grid place-items-center rounded hover:bg-surface text-on-surface-variant"
            title="익스플로러"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

function NetworkToggle({
  value,
  onChange,
}: {
  value: Net;
  onChange: (n: Net) => void;
}) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden text-xs bg-white/10 backdrop-blur">
      <button
        onClick={() => onChange("testnet")}
        className={`px-2.5 h-9 ${
          value === "testnet" ? "bg-white text-black" : "text-white/80"
        }`}
      >
        테스트넷
      </button>
      <button
        onClick={() => {
          if (
            value === "mainnet" ||
            confirm(
              "메인넷에서는 실제 자산을 다룹니다.\n시드 분실·코드 버그 시 자산을 영구히 잃을 수 있습니다.\n그래도 계속하시겠습니까?",
            )
          ) {
            onChange("mainnet");
          }
        }}
        className={`px-2.5 h-9 ${
          value === "mainnet" ? "bg-red-600 text-white" : "text-white/80"
        }`}
      >
        메인넷
      </button>
    </div>
  );
}

function MainnetWarning() {
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-4 flex gap-3">
      <ShieldAlert className="text-red-500 shrink-0" size={18} />
      <p className="text-xs text-on-surface-variant leading-relaxed">
        <span className="font-semibold text-red-500">메인넷 모드</span> — 실제
        자산이 이동합니다. 시드 구문을 분실하면 자산은 영구히 복구되지 않으며,
        본 앱은 VASP 미신고 비수탁 도구로 모든 손실은 사용자 본인 책임입니다.
      </p>
    </div>
  );
}
