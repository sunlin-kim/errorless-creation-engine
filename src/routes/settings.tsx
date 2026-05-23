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
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const currency = useWalletStore((s) => s.currency);
  const language = useWalletStore((s) => s.language);
  const autoLockMinutes = useWalletStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useWalletStore((s) => s.setAutoLockMinutes);
  const setCurrency = useWalletStore((s) => s.setCurrency);
  const setLanguage = useWalletStore((s) => s.setLanguage);
  const setVaultExists = useWalletStore((s) => s.setVaultExists);

  const t = useT();
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
    <AppShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={t("settings.security")} icon={ShieldCheck}>
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.currentStatus")}</p>
              <p className="text-xs text-on-surface-variant">
                {mnemonic ? t("settings.active") : t("settings.notReady")}
              </p>
            </div>
            <Link
              to={mnemonic ? "/wallet" : "/wallet/setup"}
              className="h-9 px-3 rounded-lg border border-outline text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {mnemonic ? t("settings.viewWallet") : t("settings.walletSetup")}
            </Link>
          </div>

          <div className="p-3 rounded-xl border border-outline">
            <p className="text-xs text-on-surface-variant">자동 잠금</p>
            <p className="text-sm font-medium mt-0.5">
              미사용 시 일정 시간 후 자동으로 잠급니다.
            </p>
            <select
              value={String(autoLockMinutes)}
              onChange={(e) => setAutoLockMinutes(parseInt(e.target.value, 10))}
              className="mt-2 w-full bg-transparent text-sm font-medium outline-none cursor-pointer border border-outline rounded-md px-2 py-1.5"
            >
              <option value="5" className="bg-surface text-on-surface">5분</option>
              <option value="10" className="bg-surface text-on-surface">10분 (권장)</option>
              <option value="30" className="bg-surface text-on-surface">30분</option>
              <option value="0" className="bg-surface text-on-surface">사용 안 함</option>
            </select>
          </div>

          <SeedRevealBlock disabled={!vaultPresent} />

          {vaultPresent && (
            <DangerZone
              onWipe={async () => {
                await deleteVault();
                useWalletStore.getState().lock();
                setVaultExists(false);
                setVaultPresent(false);
                toast.success(t("settings.deleted"));
              }}
            />
          )}
        </Card>

        <Card title={t("settings.network")} icon={Coins}>
          <div className="p-3 rounded-xl border border-outline">
            <p className="text-sm font-medium">{t("settings.activeNetwork")}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t("settings.currentMode")}{" "}
              <span
                className={`font-semibold ${
                  network === "mainnet" ? "text-red-500" : "text-emerald-500"
                }`}
              >
                {network === "mainnet" ? t("settings.mainnet") : t("settings.testnet")}
              </span>
            </p>
            <Link
              to="/wallet"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {t("settings.switchNetwork")} <ChevronRight size={12} />
            </Link>
          </div>
          <div className="text-xs text-on-surface-variant leading-relaxed px-1">
            {t("settings.networkNote")}
          </div>
        </Card>

        <Card title={t("settings.region")} icon={Globe}>
          <SelectField
            label={t("settings.currency")}
            value={currency}
            onChange={(v) => setCurrency(v as "KRW" | "USD")}
            options={[
              { value: "KRW", label: "KRW (대한민국 원)" },
              { value: "USD", label: "USD (US Dollar)" },
            ]}
          />
          <SelectField
            label={t("settings.language")}
            value={language}
            onChange={(v) => setLanguage(v as "ko" | "en")}
            options={[
              { value: "ko", label: "한국어 (Korean)" },
              { value: "en", label: "English" },
            ]}
          />
          <StaticField label={t("settings.timezone")} value="Asia/Seoul (UTC+9)" />
        </Card>

        <Card title={t("settings.legal")} icon={FileText}>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t("settings.legalBody")}
          </p>
          <Link
            to="/legal/disclaimer"
            className="mt-2 w-full flex items-center justify-between py-2 text-sm hover:text-primary"
          >
            <span>{t("settings.legalLink")}</span>
            <ChevronRight size={14} className="text-on-surface-variant" />
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}

function SeedRevealBlock({ disabled }: { disabled: boolean }) {
  const t = useT();
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
      toast.error(msg === "WRONG_PASSWORD" ? t("settings.wrongPw") : t("settings.decryptFail"));
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
      <p className="mt-1 text-sm font-medium text-on-surface">{t("settings.seedTitle")}</p>
      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
        {t("settings.seedDesc")}
      </p>

      {!open ? (
        <button
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="mt-3 h-9 px-3 rounded-lg border border-outline text-xs font-semibold disabled:opacity-40"
        >
          {t("settings.seedReveal")}
        </button>
      ) : !seed ? (
        <div className="mt-3 space-y-2">
          <input
            type="password"
            value={pw}
            autoFocus
            onChange={(e) => setPw(e.target.value)}
            placeholder={t("settings.password")}
            className="w-full h-10 rounded-lg border border-outline bg-background px-3 text-sm focus:border-primary outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={hide}
              className="flex-1 h-9 rounded-lg border border-outline text-xs"
            >
              {t("settings.cancel")}
            </button>
            <button
              onClick={reveal}
              disabled={busy || pw.length === 0}
              className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-40"
            >
              {busy ? t("settings.checking") : t("settings.confirm")}
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
            {t("settings.hide")}
          </button>
        </div>
      )}
    </div>
  );
}

function DangerZone({ onWipe }: { onWipe: () => void | Promise<void> }) {
  const t = useT();
  const [armed, setArmed] = useState(false);
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-destructive text-xs font-semibold tracking-widest">
        <AlertTriangle size={14} /> DANGER ZONE
      </div>
      <p className="mt-1 text-sm font-medium">{t("settings.dangerTitle")}</p>
      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
        {t("settings.dangerBody")}
      </p>
      {!armed ? (
        <button
          onClick={() => setArmed(true)}
          className="mt-3 h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Trash2 size={14} /> {t("settings.deleteStart")}
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setArmed(false)}
            className="flex-1 h-9 rounded-lg border border-outline text-xs"
          >
            {t("settings.cancel")}
          </button>
          <button
            onClick={onWipe}
            className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
          >
            {t("settings.deleteConfirm")}
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
