import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { Gem, Gift, TrendingUp, ChevronRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/points")({
  component: PointsPage,
});

const history = [
  { id: 1, label: "일일 출석 보너스", date: "오늘", amount: +30 },
  { id: 2, label: "송금 캐시백 (USDT)", date: "어제", amount: +120 },
  { id: 3, label: "포인트 → ETH 전환", date: "5월 18일", amount: -2400 },
  { id: 4, label: "프리미엄 미션 완료", date: "5월 15일", amount: +500 },
  { id: 5, label: "친구 초대 보상", date: "5월 12일", amount: +1000 },
];

const rewards = [
  { id: "r1", label: "스타벅스 e-쿠폰", cost: 4500, tag: "HOT" },
  { id: "r2", label: "거래 수수료 50% 할인권", cost: 3000, tag: "베스트" },
  { id: "r3", label: "프리미엄 1개월 체험", cost: 8000, tag: "한정" },
  { id: "r4", label: "USDT 5달러 전환", cost: 6500 },
];

function PointsPage() {
  const total = 12_480;
  return (
    <AppShell title="포인트" subtitle="Supervizion Rewards">
      <div className="space-y-6">
        {/* Hero balance card */}
        <section className="relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br from-[#0d2a22] via-[#0f5b46] to-[#10b981] border border-emerald-500/30">
          <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.45),transparent_60%)]" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.4),transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] font-semibold text-emerald-100/90 uppercase">
              <Sparkles size={13} className="text-amber-300" /> Supervizion Points
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="tnum text-4xl sm:text-5xl font-extrabold drop-shadow">
                {total.toLocaleString("ko-KR")}
              </span>
              <span className="text-base font-semibold text-emerald-100">P</span>
            </div>
            <p className="mt-2 text-xs text-emerald-50/80">
              이번 달 적립 1,650 P · 다음 등급까지 2,520 P
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button className="h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <TrendingUp size={15} /> 적립
              </button>
              <button className="h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Gift size={15} /> 사용
              </button>
              <button className="h-11 rounded-xl bg-amber-300 text-emerald-950 text-sm font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition-all">
                <Gem size={15} /> 전환
              </button>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rewards */}
          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">포인트 스토어</h2>
              <button className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                전체 보기 <ChevronRight size={14} />
              </button>
            </header>
            <div className="space-y-2">
              {rewards.map((r) => (
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
                  <button className="text-xs font-semibold text-primary">
                    교환
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* History */}
          <section className="rounded-3xl border border-outline bg-surface p-5">
            <header className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">포인트 내역</h2>
              <span className="text-xs text-on-surface-variant">최근 30일</span>
            </header>
            <ul className="divide-y divide-[color:var(--outline)]/40">
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
                      {h.date}
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
          </section>
        </div>
      </div>
    </AppShell>
  );
}
