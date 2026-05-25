import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/wallet/AppShell";
import { TxRow } from "@/components/wallet/TxRow";
import { NewsFeed } from "@/components/wallet/NewsFeed";
import { transactions } from "@/lib/wallet-data";
import { ChevronRight, ShieldCheck, Wallet, KeyRound } from "lucide-react";
import { hasVault } from "@/lib/wallet/vault";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const [vaultPresent, setVaultPresent] = useState<boolean | null>(null);
  const mnemonic = useWalletStore((s) => s.mnemonic);

  useEffect(() => {
    hasVault().then(setVaultPresent);
  }, []);

  const isReady = vaultPresent === true && mnemonic !== null;

  return (
    <AppShell title={t("home.title")} subtitle={t("home.subtitle")}>
      <div className="space-y-6">
        <NewsFeed />
      </div>
    </AppShell>
  );
}

function WalletStatusCard({
  vaultPresent,
  isReady,
}: {
  vaultPresent: boolean | null;
  isReady: boolean;
}) {
  const t = useT();
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
            <h3 className="font-semibold text-on-surface">{t("home.setupTitle")}</h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {t("home.setupBody")}
            </p>
            <Link
              to="/wallet/setup"
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:brightness-110"
            >
              <KeyRound size={14} /> {t("home.setupCta")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-emerald-500/15 text-emerald-500 grid place-items-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface">{t("home.activeTitle")}</h3>
          <p className="text-xs text-on-surface-variant mt-1">{t("home.activeBody")}</p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/wallet"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:brightness-110"
            >
              <Wallet size={14} /> {t("home.openWallet")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
