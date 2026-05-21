import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { Gem, Gift, TrendingUp, ChevronRight, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { REWARDS, formatRelativeDate, usePointsStore } from "@/lib/points/store";

export const Route = createFileRoute("/points")({
  component: PointsPage,
});

function PointsPage() {
  const balance = usePointsStore((s) => s.balance);
  const history = usePointsStore((s) => s.history);
  const dailyCheckin = usePointsStore((s) => s.dailyCheckin);
  const canCheckin = usePointsStore((s) => s.canCheckin)();
  const redeem = usePointsStore((s) => s.redeem);
  const spend = usePointsStore((s) => s.spend);

  const [convertOpen, setConvertOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState("1000");

  const monthEarned = history
    .filter((h) => h.amount > 0 && Date.now() - h.createdAt < 30 * 24 * 60 * 60 * 1000)
    .reduce((sum, h) => sum + h.amount, 0);
  const nextTier = Math.max(0, 15000 - balance);

  const handleCheckin = () => {
    const r = dailyCheckin();
    if (r.ok) toast.success(`출석 완료! +${r.amount} P 적립`);
    else toast.error(r.reason ?? "출석 실패");
  };

  const handleRedeem = (id: string, label: string) => {
    const r = redeem(id);
    if (r.ok) toast.success(`${label} 교환 완료`);
    else toast.error(r.reason ?? "교환 실패");
  };

  const handleConvert = () => {
    const amt = Math.floor(Number(convertAmount));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("올바른 금액을 입력하세요.");
      return;
    }
    const ok = spend(`포인트 → USDT 전환 (${amt.toLocaleString()} P)`, amt, "convert");
    if (!ok) {
      toast.error("포인트가 부족합니다.");
      return;
    }
    toast.success(`${amt.toLocaleString()} P 전환 완료`);
    setConvertOpen(false);
  };

  return (
    <AppShell title="포인트" subtitle="Supervizion Rewards">
      <div className="space-y-6">
        {/* Hero balance card */}
        <section className="relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br from-[#0d2a22] via-[#0f5b46] to-[#10b981] border border-emerald-500/30">
          <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.45),transparent_60%)]" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.4),transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] font-semibold text-emerald-100/90 uppercase">
              <Sparkles size={13} className="text-amber-300" /> Energy Points
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="tnum text-4xl sm:text-5xl font-extrabold drop-shadow">
                {balance.toLocaleString("ko-KR")}
              </span>
              <span className="text-base font-semibold text-emerald-100">P</span>
            </div>
            <p className="mt-2 text-xs text-emerald-50/80">
              최근 30일 적립 {monthEarned.toLocaleString("ko-KR")} P
              {nextTier > 0 && ` · 다음 등급까지 ${nextTier.toLocaleString("ko-KR")} P`}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                onClick={handleCheckin}
                disabled={!canCheckin}
                className="h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canCheckin ? <TrendingUp size={15} /> : <Check size={15} />}
                {canCheckin ? "적립" : "출석완료"}
              </button>
              <button
                onClick={() => {
                  const target = document.getElementById("rewards-section");
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Gift size={15} /> 사용
              </button>
              <button
                onClick={() => setConvertOpen(true)}
                className="h-11 rounded-xl bg-amber-300 text-emerald-950 text-sm font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition-all"
              >
                <Gem size={15} /> 전환
              </button>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rewards */}
          <section id="rewards-section" className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">포인트 스토어</h2>
              <button className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                전체 보기 <ChevronRight size={14} />
              </button>
            </header>
            <div className="space-y-2">
              {REWARDS.map((r) => {
                const affordable = balance >= r.cost;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-outline bg-surface-container hover:border-primary/40 transition-colors"
                  >
                    <div className="h-11 w-11 grid place-items-center rounded-xl bg-primary-container text-on-primary-container">
                      <Gift size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-on-surface truncate">
                          {r.label}
                        </p>
                        {r.tag && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-premium/15 text-premium tracking-wider">
                            {r.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant tnum">
                        {r.cost.toLocaleString("ko-KR")} P
                      </p>
                    </div>
                    <button
                      onClick={() => handleRedeem(r.id, r.label)}
                      disabled={!affordable}
                      className="text-xs font-semibold text-primary disabled:text-on-surface-variant disabled:cursor-not-allowed hover:underline disabled:no-underline"
                    >
                      {affordable ? "교환" : "부족"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* History */}
          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">포인트 내역</h2>
              <span className="text-xs text-on-surface-variant">최근 활동</span>
            </header>
            {history.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-8 text-center">
                아직 포인트 내역이 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-[color:var(--outline)]/40 max-h-[420px] overflow-y-auto">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {h.label}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {formatRelativeDate(h.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`tnum text-sm font-bold ${
                        h.amount > 0 ? "text-emerald-500" : "text-on-surface-variant"
                      }`}
                    >
                      {h.amount > 0 ? "+" : ""}
                      {h.amount.toLocaleString("ko-KR")} P
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Convert modal */}
      {convertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConvertOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface border border-outline p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-on-surface">포인트 전환</h3>
            <p className="text-xs text-on-surface-variant">
              포인트를 USDT로 전환합니다. (1,000 P = 1 USDT)
            </p>
            <div>
              <label className="text-xs font-medium text-on-surface-variant">
                전환할 포인트
              </label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-xl bg-surface-container border border-outline text-on-surface tnum focus:outline-none focus:border-primary"
                min={1}
                max={balance}
              />
              <p className="mt-1 text-[11px] text-on-surface-variant tnum">
                보유: {balance.toLocaleString("ko-KR")} P
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConvertOpen(false)}
                className="flex-1 h-11 rounded-xl border border-outline text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConvert}
                className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all"
              >
                전환하기
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
