import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { QuickActions } from "@/components/wallet/QuickActions";
import { AssetRow } from "@/components/wallet/AssetRow";
import { TxRow } from "@/components/wallet/TxRow";
import { NewsFeed } from "@/components/wallet/NewsFeed";
import { assets, transactions, totalKrw } from "@/lib/wallet-data";
import { ChevronRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="대시보드" subtitle="Supervizion · See Beyond. Lead Ahead.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BalanceCard total={totalKrw()} change={1.74} />
          <QuickActions />

          <NewsFeed />


          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">보유 자산</h2>
              <span className="text-xs text-on-surface-variant tnum">
                {assets.length}개 · 6 chains
              </span>
            </header>
            <div className="divide-y divide-[color:var(--outline)]/40">
              {assets.map((a) => (
                <AssetRow key={a.id} asset={a} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">최근 거래</h2>
              <Link
                to="/activity"
                className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
              >
                전체 보기 <ChevronRight size={14} />
              </Link>
            </header>
            <div className="space-y-1">
              {transactions.slice(0, 4).map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-premium/40 bg-gradient-to-br from-[color:var(--premium)]/10 to-transparent p-5">
            <div className="flex items-center gap-2 text-premium text-xs font-semibold tracking-[0.2em]">
              <ShieldCheck size={14} /> COMPLIANCE
            </div>
            <h3 className="mt-2 font-semibold text-on-surface">
              가상자산이용자보호법 적용
            </h3>
            <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
              이용자 예치금은 분리보관되며, 이상거래는 §10에 따라 상시
              감시됩니다. 1,000,000원 상당 이상 이전 시 트래블룰이 적용됩니다.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
