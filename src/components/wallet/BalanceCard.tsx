import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";
import { fmtKrw } from "@/lib/wallet-data";

export function BalanceCard({ total, change }: { total: number; change: number }) {
  const [hidden, setHidden] = useState(false);
  const positive = change >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl brand-gradient brand-glow text-white p-7">
      {/* decorative orbs */}
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[color:var(--tertiary)]/40 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-white/70 uppercase">
            Total Balance · 총 자산
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tnum text-4xl md:text-5xl font-semibold">
              {hidden ? "₩ ••••••••" : fmtKrw(total)}
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

        <button
          onClick={() => setHidden((h) => !h)}
          aria-label="잔액 숨기기"
          className="h-9 w-9 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="relative mt-7 grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "지갑 주소", value: "0x4F8e…A21c" },
          { label: "활성 네트워크", value: "6 chains" },
          { label: "보안 등급", value: "Premium" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur px-3 py-2.5">
            <p className="text-white/60">{s.label}</p>
            <p className="mt-1 font-medium tnum">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
