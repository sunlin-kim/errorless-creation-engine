import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { useState } from "react";
import {
  ShieldCheck,
  Fingerprint,
  Globe,
  Coins,
  KeyRound,
  Eye,
  FileText,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const mnemonic =
  "aurora vault green pulse orbit ledger silent harbor noble crystal axiom forge";

function SettingsPage() {
  const [bio, setBio] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [reveal, setReveal] = useState(false);

  return (
    <AppShell title="설정" subtitle="보안 · 통화 · 법적 고지">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="보안" icon={ShieldCheck}>
          <Toggle
            icon={Fingerprint}
            title="생체 인증"
            desc="앱 잠금 해제 시 지문/Face ID 사용"
            on={bio}
            onChange={setBio}
          />
          <Toggle
            icon={KeyRound}
            title="자동 잠금"
            desc="2분 미사용 시 자동 잠금"
            on={autoLock}
            onChange={setAutoLock}
          />

          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-warning text-xs font-semibold tracking-widest">
              <Eye size={14} /> SEED PHRASE
            </div>
            <p className="mt-1 text-sm font-medium text-on-surface">시드 구문 백업</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              누구에게도 공유하지 마세요. 노출 시 자산 전액 손실 위험.
            </p>

            <div className="relative mt-3">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-container">
                {mnemonic.split(" ").map((w, i) => (
                  <div
                    key={i}
                    className="text-xs tnum px-2 py-1.5 rounded-md bg-background border border-outline"
                  >
                    <span className="text-on-surface-variant mr-1">{i + 1}.</span>
                    {reveal ? w : "••••"}
                  </div>
                ))}
              </div>
              {!reveal && (
                <button
                  onMouseDown={() => setReveal(true)}
                  onMouseUp={() => setReveal(false)}
                  onMouseLeave={() => setReveal(false)}
                  onTouchStart={() => setReveal(true)}
                  onTouchEnd={() => setReveal(false)}
                  className="absolute inset-0 rounded-xl bg-background/60 backdrop-blur-md grid place-items-center text-xs font-medium text-on-surface hover:bg-background/50"
                >
                  길게 눌러 표시
                </button>
              )}
            </div>
          </div>
        </Card>

        <Card title="지역 및 통화" icon={Globe}>
          <Select label="기본 통화" value="KRW (대한민국 원)" />
          <Select label="언어" value="한국어 (Korean)" />
          <Select label="시간대" value="Asia/Seoul (UTC+9)" />
        </Card>

        <Card title="네트워크" icon={Coins}>
          {[
            "Ethereum Mainnet",
            "BNB Smart Chain",
            "Polygon PoS",
            "Arbitrum One",
            "Base",
            "Solana",
            "Bitcoin",
          ].map((n) => (
            <div
              key={n}
              className="flex items-center justify-between py-2.5 border-b border-outline/40 last:border-0"
            >
              <span className="text-sm">{n}</span>
              <span className="text-xs text-success">활성</span>
            </div>
          ))}
        </Card>

        <Card title="법적 고지" icon={FileText}>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            본 앱은 대한민국 <strong>특정금융정보법</strong>(VASP 신고 필요) 및
            <strong> 가상자산이용자보호법</strong>(2024.7.19 시행)을 따릅니다.
            이용자 예치금은 §6에 따라 분리보관되며, 이상거래는 §10에 따라 상시
            감시됩니다. 100만원 상당 이상 가상자산 이전 시 트래블룰이
            적용됩니다.
          </p>
          <div className="mt-3 space-y-1">
            {["이용약관", "개인정보처리방침", "오픈소스 라이선스", "버전 정보"].map(
              (i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between py-2 text-sm hover:text-primary"
                >
                  <span>{i}</span>
                  <ChevronRight size={14} className="text-on-surface-variant" />
                </button>
              ),
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-outline bg-surface p-5 space-y-4">
      <header className="flex items-center gap-2 text-on-surface">
        <span className="h-8 w-8 rounded-full grid place-items-center bg-primary-container text-on-primary-container">
          <Icon size={14} />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Toggle({
  icon: Icon,
  title,
  desc,
  on,
  onChange,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container text-left"
    >
      <span className="h-9 w-9 rounded-full grid place-items-center bg-surface-container text-on-surface-variant">
        <Icon size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-on-surface-variant">{desc}</p>
      </div>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-outline"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow ${on ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

function Select({ label, value }: { label: string; value: string }) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-outline hover:bg-surface-container">
      <div className="text-left">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
      <ChevronRight size={16} className="text-on-surface-variant" />
    </button>
  );
}
