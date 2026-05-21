import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { assets, fmtKrw, fmtNum, type Network } from "@/lib/wallet-data";
import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronRight, Check, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/send")({
  component: SendPage,
});

const networks: Network[] = ["Ethereum", "BSC", "Polygon", "Arbitrum", "Base", "Solana", "Bitcoin"];

type Step = 1 | 2 | 3 | 4;

function SendPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [assetId, setAssetId] = useState(assets[1].id);
  const [network, setNetwork] = useState<Network>("Ethereum");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const asset = useMemo(() => assets.find((a) => a.id === assetId)!, [assetId]);
  const amtNum = parseFloat(amount || "0");
  const krw = amtNum * asset.priceKrw;
  const gasKrw = Math.round(krw * 0.0008 + 2400);
  const travelRule = krw >= 1_000_000;
  const addrLooksValid = address.length >= 26;

  return (
    <AppShell title="보내기" subtitle="네트워크와 주소를 확인하세요 — 잘못된 송금은 되돌릴 수 없습니다.">
      <div className="max-w-2xl mx-auto">
        <Stepper step={step} />

        <div className="mt-6 rounded-3xl border border-outline bg-surface p-6">
          {step === 1 && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold">자산 및 네트워크 선택</h2>
              <div>
                <label className="text-xs text-on-surface-variant">자산</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAssetId(a.id);
                        setNetwork(a.network);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        assetId === a.id
                          ? "border-primary bg-primary-container text-on-primary-container"
                          : "border-outline hover:bg-surface-container"
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded-full grid place-items-center text-white text-xs font-semibold"
                        style={{ backgroundColor: a.color }}
                      >
                        {a.symbol[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.symbol}</p>
                        <p className="text-[11px] text-on-surface-variant tnum truncate">
                          {fmtNum(a.balance, 4)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant">네트워크</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {networks.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNetwork(n)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        network === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-outline text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {network !== asset.network && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <p>
                      선택한 네트워크가 {asset.symbol}의 기본 네트워크({asset.network})와
                      다릅니다. 수신 측 호환 여부를 반드시 확인하세요.
                    </p>
                  </div>
                )}
              </div>

              <PrimaryNext onClick={() => setStep(2)} disabled={false} />
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold">받는 주소</h2>
              <div>
                <label className="text-xs text-on-surface-variant">지갑 주소</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x… 또는 bc1q…"
                  rows={3}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-outline bg-background text-sm tnum focus:outline-none focus:border-primary"
                />
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  주소 첫 6자리와 마지막 4자리를 반드시 다시 확인하세요.
                </p>
              </div>
              <BackNext onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!addrLooksValid} />
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold">금액</h2>
              <div className="rounded-2xl border border-outline p-4">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>보낼 금액</span>
                  <button
                    onClick={() => setAmount(asset.balance.toString())}
                    className="text-primary"
                  >
                    최대 사용
                  </button>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                    className="tnum text-3xl font-semibold bg-transparent w-full focus:outline-none"
                  />
                  <span className="text-on-surface-variant font-medium">{asset.symbol}</span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant tnum">≈ {fmtKrw(krw)}</p>
                <p className="mt-2 text-[11px] text-on-surface-variant tnum">
                  잔액 {fmtNum(asset.balance, 6)} {asset.symbol}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container p-4 text-xs space-y-2">
                <Row label="네트워크 수수료(추정)" value={fmtKrw(gasKrw)} />
                <Row label="총 차감" value={fmtKrw(krw + gasKrw)} bold />
              </div>

              {travelRule && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <p>
                    <strong>트래블룰 적용</strong> — 100만원 상당 이상 이전 시 송·수신자
                    정보 제공이 요구됩니다. 다음 단계에서 확인이 필요합니다.
                  </p>
                </div>
              )}

              <BackNext onBack={() => setStep(2)} onNext={() => setStep(4)} disabled={!amtNum || amtNum > asset.balance} />
            </section>
          )}

          {step === 4 && (
            <section className="space-y-5">
              <h2 className="text-lg font-semibold">최종 확인</h2>
              <div className="rounded-2xl brand-gradient text-white p-5">
                <p className="text-xs text-white/70 tracking-widest uppercase">보낼 금액</p>
                <p className="mt-1 tnum text-3xl font-semibold">
                  {fmtNum(amtNum, 6)} {asset.symbol}
                </p>
                <p className="text-sm text-white/80 tnum">≈ {fmtKrw(krw)}</p>
              </div>

              <div className="rounded-2xl border border-outline p-4 text-sm space-y-3">
                <Row label="자산" value={`${asset.name} (${asset.symbol})`} />
                <Row label="네트워크" value={network} />
                <Row label="받는 주소" value={address || "—"} mono />
                <Row label="예상 수수료" value={fmtKrw(gasKrw)} />
                <Row label="총 차감" value={fmtKrw(krw + gasKrw)} bold />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-container text-on-primary-container text-xs">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                <p>
                  Supervizion은 송금 직전 가스가 변동되면 자동으로 재추정합니다.
                  Nonce 충돌 시 마지막 트랜잭션이 대기열에 큐잉됩니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 rounded-xl border border-outline font-medium hover:bg-surface-container"
                >
                  뒤로
                </button>
                <button
                  onClick={() => nav({ to: "/activity" })}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95 inline-flex items-center justify-center gap-2"
                >
                  <Check size={16} /> 송금 실행
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`text-right break-all ${bold ? "font-semibold" : ""} ${mono ? "tnum text-xs" : "tnum"}`}>
        {value}
      </span>
    </div>
  );
}

function PrimaryNext({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95 disabled:opacity-40 inline-flex items-center justify-center gap-1"
    >
      다음 <ChevronRight size={16} />
    </button>
  );
}

function BackNext({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled: boolean }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="h-12 px-5 rounded-xl border border-outline font-medium hover:bg-surface-container inline-flex items-center gap-1"
      >
        <ArrowLeft size={16} /> 뒤로
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-95 disabled:opacity-40 inline-flex items-center justify-center gap-1"
      >
        다음 <ChevronRight size={16} />
      </button>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["자산", "주소", "금액", "확인"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                    : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {done ? <Check size={14} /> : n}
            </div>
            <span className={`text-xs ${active ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-outline" />}
          </div>
        );
      })}
    </div>
  );
}
