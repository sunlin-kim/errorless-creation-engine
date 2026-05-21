import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Globe,
  Coins,
  Eye,
  FileText,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useWalletStore } from "@/lib/wallet/store";
import { loadVault, deleteVault, hasVault } from "@/lib/wallet/vault";
import { decryptString } from "@/lib/wallet/crypto";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const currency = useWalletStore((s) => s.currency);
  const language = useWalletStore((s) => s.language);
  const setCurrency = useWalletStore((s) => s.setCurrency);
  const setLanguage = useWalletStore((s) => s.setLanguage);
  const setVaultExists = useWalletStore((s) => s.setVaultExists);

  const [vaultPresent, setVaultPresent] = useState<boolean>(false);
  useEffect(() => {
    hasVault().then(setVaultPresent);
  }, [mnemonic]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <AppShell title="설정" subtitle="보안 · 통화 · 법적 고지">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="보안" icon={ShieldCheck}>
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline">
            <div className="min-w-0">
              <p className="text-sm font-medium">현재 상태</p>
              <p className="text-xs text-on-surface-variant">
                {mnemonic ? "이 기기에서 활성" : "지갑 확인 중 또는 미설정"}
              </p>
            </div>
            <Link
              to={mnemonic ? "/wallet" : "/wallet/setup"}
              className="h-9 px-3 rounded-lg border border-outline text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {mnemonic ? "지갑 보기" : "지갑 설정"}
            </Link>
          </div>


          <SeedRevealBlock disabled={!vaultPresent} />

          {vaultPresent && (
            <DangerZone
              onWipe={async () => {
                await deleteVault();
                useWalletStore.getState().lock();
                setVaultExists(false);
                setVaultPresent(false);
                toast.success("지갑이 이 기기에서 삭제되었습니다");
              }}
            />
          )}
        </Card>

        <Card title="네트워크" icon={Coins}>
          <div className="p-3 rounded-xl border border-outline">
            <p className="text-sm font-medium">활성 네트워크</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              현재 모드:{" "}
              <span
                className={`font-semibold ${
                  network === "mainnet" ? "text-red-500" : "text-emerald-500"
                }`}
              >
                {network === "mainnet" ? "메인넷" : "테스트넷"}
              </span>
            </p>
            <Link
              to="/wallet"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              지갑에서 네트워크 전환 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="text-xs text-on-surface-variant leading-relaxed px-1">
            지원: Ethereum (Mainnet · Sepolia), Bitcoin (Mainnet · Testnet), USDT
            (ERC-20). 그 외 체인은 로드맵 상 후속 단계에서 추가됩니다.
          </div>
        </Card>

        <Card title="지역 및 통화" icon={Globe}>
          <SelectField
            label="기본 통화"
            value={currency}
            onChange={(v) => setCurrency(v as "KRW" | "USD")}
            options={[
              { value: "KRW", label: "KRW (대한민국 원)" },
              { value: "USD", label: "USD (US Dollar)" },
            ]}
          />
          <SelectField
            label="언어"
            value={language}
            onChange={(v) => setLanguage(v as "ko" | "en")}
            options={[
              { value: "ko", label: "한국어 (Korean)" },
              { value: "en", label: "English" },
            ]}
          />
          <StaticField label="시간대" value="Asia/Seoul (UTC+9)" />
        </Card>

        <Card title="법적 고지" icon={FileText}>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            본 앱은 <strong>비수탁(Non-custodial)</strong> 도구입니다. 시드 구문 및
            개인키는 사용자 기기에만 존재하며, 운영자는 자산을 보관·복구·동결할
            수 없습니다. 자산 손실에 대한 모든 책임은 사용자에게 있습니다.
          </p>
          <Link
            to="/legal/disclaimer"
            className="mt-2 w-full flex items-center justify-between py-2 text-sm hover:text-primary"
          >
            <span>전체 면책 고지 보기</span>
            <ChevronRight size={14} className="text-on-surface-variant" />
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}

function SeedRevealBlock({ disabled }: { disabled: boolean }) {
  const [pw, setPw] = useState("");
  const [seed, setSeed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function reveal() {
    setBusy(true);
    try {
      const v = await loadVault();
      if (!v) throw new Error("NO_VAULT");
      const m = await decryptString(v.encryptedMnemonic, pw);
      setSeed(m);
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg === "WRONG_PASSWORD" ? "비밀번호가 올바르지 않습니다" : "복호화 실패");
    } finally {
      setBusy(false);
    }
  }

  function hide() {
    setSeed(null);
    setPw("");
    setOpen(false);
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold tracking-widest">
        <Eye size={14} /> SEED PHRASE
      </div>
      <p className="mt-1 text-sm font-medium text-on-surface">시드 구문 백업 보기</p>
      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
        누구에게도 공유하지 마세요. 노출되면 자산 전액 손실 위험이 있습니다.
        조회 시 비밀번호를 한 번 더 확인합니다.
      </p>

      {!open ? (
        <button
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="mt-3 h-9 px-3 rounded-lg border border-outline text-xs font-semibold disabled:opacity-40"
        >
          시드 구문 조회
        </button>
      ) : !seed ? (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={pw}
            autoFocus
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            className="w-full h-10 rounded-lg border border-outline bg-background px-3 text-sm focus:border-primary outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={hide}
              className="flex-1 h-9 rounded-lg border border-outline text-xs"
            >
              취소
            </button>
            <button
              onClick={reveal}
              disabled={busy || pw.length === 0}
              className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40"
            >
              {busy ? "확인 중..." : "조회"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 p-3 rounded-xl bg-surface-container">
            {seed.split(" ").map((w, i) => (
              <div
                key={i}
                className="text-xs tnum px-2 py-1.5 rounded-md bg-background border border-outline"
              >
                <span className="text-on-surface-variant mr-1">{i + 1}.</span>
                <span className="font-mono">{w}</span>
              </div>
            ))}
          </div>
          <button
            onClick={hide}
            className="w-full h-9 rounded-lg border border-outline text-xs font-semibold"
          >
            숨기기
          </button>
        </div>
      )}
    </div>
  );
}

function DangerZone({ onWipe }: { onWipe: () => void | Promise<void> }) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-destructive text-xs font-semibold tracking-widest">
        <AlertTriangle size={14} /> DANGER ZONE
      </div>
      <p className="mt-1 text-sm font-medium">이 기기에서 지갑 삭제</p>
      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
        암호화된 시드를 이 기기에서 영구히 제거합니다. 시드 구문 백업이 없다면
        자산을 복구할 수 없습니다.
      </p>
      {!armed ? (
        <button
          onClick={() => setArmed(true)}
          className="mt-3 h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Trash2 size={14} /> 삭제 시작
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setArmed(false)}
            className="flex-1 h-9 rounded-lg border border-outline text-xs"
          >
            취소
          </button>
          <button
            onClick={onWipe}
            className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
          >
            영구 삭제 확정
          </button>
        </div>
      )}
    </div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="w-full block p-3 rounded-xl border border-outline hover:bg-surface-container cursor-pointer">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-on-surface">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full flex items-center justify-between p-3 rounded-xl border border-outline">
      <div className="text-left">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
      <ChevronRight size={16} className="text-on-surface-variant opacity-40" />
    </div>
  );
}
