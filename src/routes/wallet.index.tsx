import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { deriveAddresses } from "@/lib/wallet/derive";
import { getEndpoints } from "@/lib/wallet/networks";
import {
  getEthBalance,
  getBtcBalance,
  getUsdtBalance,
  getPricesKrw,
  toKrw,
  formatKrw,
  type AssetBalance,
} from "@/lib/wallet/balance";
import {
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/")({
  component: WalletPage,
});

function WalletPage() {
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const setNetwork = useWalletStore((s) => s.setNetwork);

  if (!mnemonic) {
    return (
      <AppShell title="지갑" subtitle="잠금 해제가 필요합니다">
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <Lock size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            지갑이 잠겨 있거나 아직 생성되지 않았습니다.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/wallet/unlock"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold"
            >
              <Lock size={14} /> 잠금 해제
            </Link>
            <Link
              to="/wallet/setup"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline text-xs font-semibold"
            >
              <KeyRound size={14} /> 새로 만들기
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return <WalletInner mnemonic={mnemonic} network={network} setNetwork={setNetwork} />;
}

function WalletInner({
  mnemonic,
  network,
  setNetwork,
}: {
  mnemonic: string;
  network: "testnet" | "mainnet";
  setNetwork: (n: "testnet" | "mainnet") => void;
}) {
  const ep = useMemo(() => getEndpoints(network), [network]);
  const [addrs, setAddrs] = useState<{ eth: string; btc: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    deriveAddresses(mnemonic, network)
      .then((a) => {
        if (!cancelled) setAddrs({ eth: a.eth, btc: a.btc });
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
    queryKey: ["balances", network, addrs?.eth, addrs?.btc],
    queryFn: async () => {
      if (!addrs) throw new Error("no addr");
      const [eth, btc, usdt, prices] = await Promise.all([
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
        getPricesKrw(),
      ]);
      return { eth, btc, usdt, prices };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const totalKrw = useMemo(() => {
    const d = balancesQ.data;
    if (!d) return 0;
    let sum = 0;
    if (d.eth) sum += toKrw(d.eth, d.prices.prices);
    if (d.btc) sum += toKrw(d.btc, d.prices.prices);
    if (d.usdt) sum += toKrw(d.usdt, d.prices.prices);
    return sum;
  }, [balancesQ.data]);

  return (
    <AppShell title="지갑" subtitle={`비수탁 · ${ep.label}`}>
      <div className="space-y-6">
        {network === "mainnet" && <MainnetWarning />}

        <div className="rounded-3xl border border-outline bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant">총 평가액 (KRW)</p>
              <p className="text-3xl font-semibold mt-1">
                {balancesQ.isPending ? "—" : formatKrw(totalKrw)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NetworkToggle value={network} onChange={setNetwork} />
              <Link
                to="/wallet/send"
                className="h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1.5"
              >
                송금
              </Link>
              <button
                onClick={() => balancesQ.refetch()}
                disabled={balancesQ.isFetching}
                className="h-9 w-9 grid place-items-center rounded-lg border border-outline hover:bg-surface-container disabled:opacity-50"
                title="새로고침"
              >
                <RefreshCw
                  size={14}
                  className={balancesQ.isFetching ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AssetCard
            symbol="ETH"
            name={network === "mainnet" ? "Ethereum" : "Sepolia ETH"}
            address={addrs?.eth}
            balance={balancesQ.data?.eth ?? null}
            priceKrw={balancesQ.data?.prices.prices.ETH ?? 0}
            explorer={`${ep.ethExplorer}/address/${addrs?.eth ?? ""}`}
            loading={balancesQ.isPending}
          />
          {ep.usdtContract && (
            <AssetCard
              symbol="USDT"
              name="Tether USD (ERC-20)"
              address={addrs?.eth}
              balance={balancesQ.data?.usdt ?? null}
              priceKrw={balancesQ.data?.prices.USDT ?? 0}
              explorer={`${ep.ethExplorer}/token/${ep.usdtContract}?a=${addrs?.eth ?? ""}`}
              loading={balancesQ.isPending}
            />
          )}
          <AssetCard
            symbol="BTC"
            name={network === "mainnet" ? "Bitcoin" : "Bitcoin Testnet"}
            address={addrs?.btc}
            balance={balancesQ.data?.btc ?? null}
            priceKrw={balancesQ.data?.prices.BTC ?? 0}
            explorer={`${ep.btcExplorer}/address/${addrs?.btc ?? ""}`}
            loading={balancesQ.isPending}
          />
        </div>

        <p className="text-[11px] text-on-surface-variant text-center">
          Step 3에서 송금 기능이 활성화됩니다. 현재는 잔액·주소 조회 전용입니다.
        </p>
      </div>
    </AppShell>
  );
}

function NetworkToggle({
  value,
  onChange,
}: {
  value: "testnet" | "mainnet";
  onChange: (n: "testnet" | "mainnet") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-outline overflow-hidden text-xs">
      <button
        onClick={() => onChange("testnet")}
        className={`px-2.5 h-9 ${
          value === "testnet"
            ? "bg-primary text-on-primary"
            : "bg-surface text-on-surface-variant"
        }`}
      >
        테스트넷
      </button>
      <button
        onClick={() => {
          if (
            confirm(
              "메인넷에서는 실제 자산을 다룹니다.\n시드 분실·코드 버그 시 자산을 영구히 잃을 수 있습니다.\n그래도 계속하시겠습니까?",
            )
          ) {
            onChange("mainnet");
          }
        }}
        className={`px-2.5 h-9 border-l border-outline ${
          value === "mainnet"
            ? "bg-red-600 text-white"
            : "bg-surface text-on-surface-variant"
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
        <span className="font-semibold text-red-500">메인넷 모드</span> — 실제 자산이
        이동합니다. 시드 구문을 분실하면 자산은 영구히 복구되지 않으며, 본 앱은
        VASP 미신고 비수탁 도구로 모든 손실은 사용자 본인 책임입니다.
      </p>
    </div>
  );
}

function AssetCard({
  symbol,
  name,
  address,
  balance,
  priceKrw,
  explorer,
  loading,
}: {
  symbol: "ETH" | "BTC" | "USDT";
  name: string;
  address: string | undefined;
  balance: AssetBalance | null;
  priceKrw: number;
  explorer: string;
  loading: boolean;
}) {
  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("주소가 복사되었습니다");
  };
  const krw = balance && priceKrw ? toKrw(balance, { [symbol]: priceKrw } as never) : 0;
  return (
    <section className="rounded-2xl border border-outline bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{symbol}</p>
          <p className="text-[11px] text-on-surface-variant">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono">
            {loading || !balance ? "—" : balance.formatted}{" "}
            <span className="text-on-surface-variant">{symbol}</span>
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {balance && priceKrw ? formatKrw(krw) : "—"}
          </p>
        </div>
      </div>
      {address && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-container px-2.5 py-2">
          <code className="flex-1 text-[11px] font-mono truncate">{address}</code>
          <button
            onClick={copy}
            className="h-7 w-7 grid place-items-center rounded hover:bg-surface text-on-surface-variant"
            title="복사"
          >
            <Copy size={12} />
          </button>
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="h-7 w-7 grid place-items-center rounded hover:bg-surface text-on-surface-variant"
            title="익스플로러"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </section>
  );
}
