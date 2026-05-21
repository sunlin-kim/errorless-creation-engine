import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/wallet/Logo";
import { decryptString } from "@/lib/wallet/crypto";
import { hasVault, loadVault, deleteVault } from "@/lib/wallet/vault";
import { useWalletStore } from "@/lib/wallet/store";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { KeyRound, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/wallet/unlock")({
  component: UnlockPage,
});

function UnlockPage() {
  const t = useT();
  const navigate = useNavigate();
  const unlock = useWalletStore((s) => s.unlock);
  const setVaultExists = useWalletStore((s) => s.setVaultExists);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    hasVault().then((exists) => {
      if (!exists) navigate({ to: "/wallet/setup" });
    });
  }, [navigate]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const v = await loadVault();
      if (!v) {
        navigate({ to: "/wallet/setup" });
        return;
      }
      const mnemonic = await decryptString(v.encryptedMnemonic, pw);
      unlock(mnemonic);
      setVaultExists(true);
      toast.success(t("unlock.loadedToast"));
      navigate({ to: "/wallet" });
    } catch (err) {
      if ((err as Error).message === "WRONG_PASSWORD") {
        toast.error(t("unlock.wrongPw"));
      } else {
        toast.error(t("unlock.loadFail", { msg: (err as Error).message }));
      }
      setPw("");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    await deleteVault();
    useWalletStore.getState().lock();
    setVaultExists(false);
    toast.success(t("unlock.deletedToast"));
    navigate({ to: "/wallet/setup" });
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} />
          <h1 className="mt-4 text-xl font-bold">Supervizion</h1>
          <p className="text-xs text-on-surface-variant mt-1">{t("unlock.tagline")}</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="rounded-2xl border border-outline bg-surface p-5">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
              <KeyRound size={16} className="text-primary" /> {t("unlock.passwordCheck")}
            </div>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              placeholder={t("unlock.password")}
              className="w-full h-11 rounded-lg border border-outline bg-background px-3 text-sm focus:border-primary outline-none"
            />
            <button
              type="submit"
              disabled={busy || pw.length === 0}
              className="mt-3 w-full h-11 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              {busy ? t("unlock.checking") : t("unlock.loadWallet")}
            </button>
          </div>

          <div className="text-center">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs text-on-surface-variant hover:text-on-surface hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            ) : (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-left">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                  <p>
                    비밀번호 복구는 불가능합니다. 지갑을 삭제하고 시드 구문으로 다시 복구할 수 있습니다.
                    <strong> 시드가 없으면 자산을 영구히 잃습니다.</strong>
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 h-9 rounded-lg border border-outline text-xs"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
                  >
                    지갑 삭제하고 복구
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/"
            className="block text-center text-xs text-on-surface-variant hover:underline"
          >
            홈으로
          </Link>
        </form>
      </div>
    </div>
  );
}
