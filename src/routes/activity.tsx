import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/wallet/AppShell";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";
import { deriveAddresses } from "@/lib/wallet/derive";
import { getEndpoints } from "@/lib/wallet/networks";
import { getAllHistory, type HistoryItem } from "@/lib/wallet/history";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ExternalLink,
  KeyRound,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

type AssetFilter = "all" | "ETH" | "USDT" | "BTC";
type DirFilter = "all" | "in" | "out";

function ActivityPage() {
  const t = useT();
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const navigate = useNavigate();
  const ep = useMemo(() => getEndpoints(network), [network]);
  const [addrs, setAddrs] = useState<{ eth: string; btc: string } | null>(null);
  const [asset, setAsset] = useState<AssetFilter>("all");
  const [dir, setDir] = useState<DirFilter>("all");

  useEffect(() => {
    if (!mnemonic) return;
    deriveAddresses(mnemonic, network)
      .then((a) => setAddrs({ eth: a.eth, btc: a.btc }))
      .catch(() => setAddrs(null));
  }, [mnemonic, network]);

  const q = useQuery({
    enabled: !!addrs,
    queryKey: ["history", network, addrs?.eth, addrs?.btc],
    queryFn: () => getAllHistory(ep, addrs!.eth, addrs!.btc),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!mnemonic) {
    return (
      <AppShell title={t("activity.title")} subtitle={t("activity.subtitleWaiting")}>
        <div className="rounded-3xl border border-outline bg-surface p-8 text-center">
          <KeyRound size={28} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-sm text-on-surface-variant">
            {t("activity.needWallet")}
          </p>
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

  const filtered = (q.data ?? []).filter(
    (it) =>
      (asset === "all" || it.asset === asset) &&
      (dir === "all" || it.direction === dir),
  );

  return (
    <AppShell title={t("activity.title")} subtitle={t("activity.subtitleLive", { label: ep.label })}>
      <div className="rounded-3xl border border-outline bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "ETH", "USDT", "BTC"] as AssetFilter[]).map((a) => (
            <FilterChip
              key={a}
              active={asset === a}
              onClick={() => setAsset(a)}
              label={a === "all" ? t("activity.allAssets") : a}
            />
          ))}
          <span className="mx-2 h-5 w-px bg-outline" />
          {(["all", "in", "out"] as DirFilter[]).map((d) => (
            <FilterChip
              key={d}
              active={dir === d}
              onClick={() => setDir(d)}
              label={d === "all" ? t("activity.allDirs") : d === "in" ? t("activity.dirIn") : t("activity.dirOut")}
            />
          ))}
          <button
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            className="ml-auto h-8 w-8 grid place-items-center rounded-lg border border-outline hover:bg-surface-container disabled:opacity-50"
            title={t("activity.refresh")}
          >
            <RefreshCw size={13} className={q.isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-4 divide-y divide-[color:var(--outline)]/40">
          {q.isPending && (
            <p className="py-10 text-center text-sm text-on-surface-variant">
              {t("activity.loading")}
            </p>
          )}
          {q.isError && (
            <p className="py-10 text-center text-sm text-red-500">
              {t("activity.error")}
            </p>
          )}
          {!q.isPending && !q.isError && filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-on-surface-variant">
              {t("activity.empty")}
            </p>
          )}
          {filtered.map((it) => (
            <HistoryRow key={it.id} item={it} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-on-primary border-primary"
          : "border-outline text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {label}
    </button>
  );
}

const DIR_ICON = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  self: ArrowLeftRight,
} as const;

function HistoryRow({ item }: { item: HistoryItem }) {
  const Icon = DIR_ICON[item.direction];
  const time = new Date(item.timestamp).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const sign =
    item.direction === "out" ? "-" : item.direction === "in" ? "+" : "";
  const tone =
    item.status === "failed"
      ? "text-red-500"
      : item.status === "pending"
        ? "text-amber-500"
        : "text-on-surface";

  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-colors">
      <span
        className={`h-10 w-10 rounded-full grid place-items-center ${
          item.direction === "in"
            ? "bg-emerald-500/15 text-emerald-500"
            : item.direction === "out"
              ? "bg-primary/15 text-primary"
              : "bg-surface-container text-on-surface-variant"
        }`}
      >
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">
            {item.direction === "in" ? "받음" : item.direction === "out" ? "보냄" : "내부 이동"}
          </p>
          {item.status !== "success" && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                item.status === "failed"
                  ? "bg-red-500/15 text-red-500"
                  : "bg-amber-500/15 text-amber-500"
              }`}
            >
              {item.status === "failed" ? "실패" : "진행중"}
            </span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant truncate font-mono">
          {item.counterparty} · {item.network}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium font-mono ${tone}`}>
          {sign}
          {item.amount} {item.asset}
        </p>
        <p className="text-[11px] text-on-surface-variant font-mono">
          <a
            href={item.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-primary"
          >
            {time} <ExternalLink size={10} />
          </a>
        </p>
      </div>
    </div>
  );
}
