import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { TxRow } from "@/components/wallet/TxRow";
import { NewsFeed } from "@/components/wallet/NewsFeed";
import { transactions } from "@/lib/wallet-data";
import { ChevronRight, ShieldCheck, Wallet, Lock, KeyRound } from "lucide-react";
import { hasVault } from "@/lib/wallet/vault";
import { useWalletStore } from "@/lib/wallet/store";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [vaultPresent, setVaultPresent] = useState<boolean | null>(null);
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const lock = useWalletStore((s) => s.lock);

  useEffect(() => {
    hasVault().then(setVaultPresent);
  }, []);

  const isUnlocked = mnemonic !== null;

  return (
    <AppShell title="홈" subtitle="Supervizion · See Beyond. Lead Ahead.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WalletStatusCard
            vaultPresent={vaultPresent}
            isUnlocked={isUnlocked}
            onLock={lock}
          />
          <NewsFeed />
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

function WalletStatusCard({
  vaultPresent,
  isUnlocked,
  onLock,
}: {
  vaultPresent: boolean | null;
  isUnlocked: boolean;
  onLock: () => void;
}) {
  if (vaultPresent === null) {
    return (
      <section className="rounded-3xl border border-outline bg-surface p-5 h-28 animate-pulse" />
    );
  }

  if (!vaultPresent) {
    return (
      <section className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
            <Wallet size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-on-surface">실제 지갑을 설정하세요</h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              비수탁(Non-custodial) 지갑 — 시드 구문은 본인 기기에만 저장됩니다.
              기본 테스트넷에서 안전하게 시작하세요.
            </p>
            <Link
              to="/wallet/setup"
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:brightness-110"
            >
              <KeyRound size={14} /> 지갑 만들기 / 복구
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!isUnlocked) {
    return (
      <section className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 text-amber-500 grid place-items-center shrink-0">
            <Lock size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-on-surface">지갑이 잠겨 있습니다</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              잔액 조회 및 송금을 하려면 비밀번호로 잠금을 해제하세요.
            </p>
            <Link
              to="/wallet/unlock"
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-500 text-amber-950 text-xs font-semibold hover:brightness-110"
            >
              <Lock size={14} /> 잠금 해제
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-emerald-500/15 text-emerald-500 grid place-items-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface">지갑이 활성화되었습니다</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            주소·잔액을 확인하고 네트워크(테스트넷/메인넷)를 전환할 수 있습니다.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/wallet"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:brightness-110"
            >
              <Wallet size={14} /> 지갑 열기
            </Link>
            <button
              onClick={onLock}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-outline text-xs font-semibold hover:bg-surface-container"
            >
              <Lock size={14} /> 잠그기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


