import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/wallet/Logo";
import { createMnemonic, isValidMnemonic, normalizeMnemonic } from "@/lib/wallet/seed";
import { encryptString } from "@/lib/wallet/crypto";
import { saveVault, hasVault, markBackupConfirmed } from "@/lib/wallet/vault";
import { useWalletStore } from "@/lib/wallet/store";
import { AlertTriangle, Check, Copy, Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/setup")({
  component: SetupPage,
});

/** 클립보드 복사 — iframe·비-HTTPS 환경에서도 동작하는 폴백 포함 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type Mode = "intro" | "create-show" | "create-confirm" | "create-password" | "restore";

function SetupPage() {
  const navigate = useNavigate();
  const setVaultExists = useWalletStore((s) => s.setVaultExists);
  const unlock = useWalletStore((s) => s.unlock);
  const [mode, setMode] = useState<Mode>("intro");
  const [agreed, setAgreed] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>("");
  const [restorePhrase, setRestorePhrase] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showSeed, setShowSeed] = useState(false);
  const [busy, setBusy] = useState(false);

  const [existingVault, setExistingVault] = useState(false);

  // 이미 vault 있으면 안내만 표시(자동 리다이렉트 X) — 사용자가 직접 unlock/덮어쓰기 선택
  useEffect(() => {
    hasVault().then((exists) => {
      setExistingVault(exists);
    });
  }, []);

  async function overwriteExisting() {
    if (!confirm("기존 지갑을 삭제하고 새로 만드시겠습니까? 시드가 없으면 자산을 영구히 잃습니다.")) return;
    const { deleteVault } = await import("@/lib/wallet/vault");
    await deleteVault();
    setExistingVault(false);
    toast.success("기존 지갑이 삭제되었습니다. 새로 만들 수 있습니다.");
  }

  function startCreate() {
    setMnemonic(createMnemonic());
    setMode("create-show");
  }

  async function finalizeCreate() {
    if (pw.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (pw !== pw2) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    setBusy(true);
    try {
      const encrypted = await encryptString(mnemonic, pw);
      await saveVault({
        encryptedMnemonic: encrypted,
        createdAt: Date.now(),
        backupConfirmed: true,
      });
      await markBackupConfirmed();
      unlock(mnemonic);
      setVaultExists(true);
      toast.success("지갑이 생성되었습니다");
      navigate({ to: "/" });
    } catch (e) {
      toast.error("지갑 생성 실패: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finalizeRestore() {
    const phrase = normalizeMnemonic(restorePhrase);
    if (!isValidMnemonic(phrase)) {
      toast.error("올바르지 않은 시드 구문입니다 (12단어, BIP39)");
      return;
    }
    if (pw.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (pw !== pw2) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    setBusy(true);
    try {
      const encrypted = await encryptString(phrase, pw);
      await saveVault({
        encryptedMnemonic: encrypted,
        createdAt: Date.now(),
        backupConfirmed: true,
      });
      unlock(phrase);
      setVaultExists(true);
      toast.success("지갑이 복구되었습니다");
      navigate({ to: "/" });
    } catch (e) {
      toast.error("복구 실패: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="px-5 h-14 flex items-center gap-3 border-b border-outline">
        {mode !== "intro" ? (
          <button
            onClick={() => {
              if (mode === "create-password") setMode("create-confirm");
              else if (mode === "create-confirm") setMode("create-show");
              else if (mode === "create-show") setMode("intro");
              else if (mode === "restore") setMode("intro");
            }}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface-container"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Logo size={22} />
        )}
        <h1 className="text-sm font-semibold">
          {mode === "intro" && "지갑 설정"}
          {mode === "create-show" && "시드 구문 백업 (1/3)"}
          {mode === "create-confirm" && "시드 구문 확인 (2/3)"}
          {mode === "create-password" && "비밀번호 설정 (3/3)"}
          {mode === "restore" && "지갑 복구"}
        </h1>
      </header>

      <main className="flex-1 px-5 py-8 max-w-lg w-full mx-auto">
        {mode === "intro" && (
          <IntroStep
            agreed={agreed}
            setAgreed={setAgreed}
            onCreate={startCreate}
            onRestore={() => setMode("restore")}
          />
        )}
        {mode === "create-show" && (
          <ShowSeedStep
            mnemonic={mnemonic}
            showSeed={showSeed}
            setShowSeed={setShowSeed}
            onNext={() => setMode("create-confirm")}
          />
        )}
        {mode === "create-confirm" && (
          <ConfirmSeedStep
            mnemonic={mnemonic}
            onBack={() => setMode("create-show")}
            onNext={() => setMode("create-password")}
          />
        )}
        {mode === "create-password" && (
          <PasswordStep
            pw={pw}
            setPw={setPw}
            pw2={pw2}
            setPw2={setPw2}
            busy={busy}
            onSubmit={finalizeCreate}
            submitLabel="지갑 생성"
          />
        )}
        {mode === "restore" && (
          <RestoreStep
            restorePhrase={restorePhrase}
            setRestorePhrase={setRestorePhrase}
            pw={pw}
            setPw={setPw}
            pw2={pw2}
            setPw2={setPw2}
            busy={busy}
            onSubmit={finalizeRestore}
          />
        )}
      </main>
    </div>
  );
}

function IntroStep({
  agreed,
  setAgreed,
  onCreate,
  onRestore,
}: {
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onCreate: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-on-surface">
            <p className="font-semibold mb-1">⚠️ 베타 — 비수탁 지갑</p>
            <ul className="space-y-1 text-on-surface-variant list-disc list-inside text-xs">
              <li>시드 구문은 본인 기기에만 저장됩니다. 분실 시 자산을 영구히 잃습니다.</li>
              <li>Supervizion 은 시드·비밀번호·자산을 보관하지 않으며 복구해드릴 수 없습니다.</li>
              <li>코드 결함으로 자산 손실이 발생할 수 있으며, 모든 책임은 사용자에게 있습니다.</li>
              <li>기본 네트워크는 <strong>테스트넷</strong> 입니다. 메인넷 전환은 추후 단계에서 별도 경고와 함께.</li>
            </ul>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 p-3 rounded-xl border border-outline cursor-pointer hover:bg-surface-container">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span className="text-sm">
          위 내용을 모두 읽었으며, 비수탁 지갑의 위험을 이해하고 동의합니다.
        </span>
      </label>

      <div className="space-y-3 pt-2">
        <button
          disabled={!agreed}
          onClick={onCreate}
          className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          새 지갑 생성
        </button>
        <button
          disabled={!agreed}
          onClick={onRestore}
          className="w-full h-12 rounded-xl border border-outline font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition"
        >
          시드로 기존 지갑 복구
        </button>
        <Link
          to="/"
          className="block text-center text-xs text-on-surface-variant pt-2 hover:underline"
        >
          나중에 하기 (데모 화면으로)
        </Link>
      </div>
    </div>
  );
}

function ShowSeedStep({
  mnemonic,
  showSeed,
  setShowSeed,
  onNext,
}: {
  mnemonic: string;
  showSeed: boolean;
  setShowSeed: (v: boolean) => void;
  onNext: () => void;
}) {
  const words = mnemonic.split(" ");
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2 text-xs text-amber-200">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          이 12단어는 지갑의 <strong>유일한 백업</strong> 입니다. 종이에 적어 안전한 곳에 보관하세요. 사진·스크린샷·클라우드 저장은 위험합니다.
        </span>
      </div>

      <div className="relative rounded-2xl border border-outline bg-surface-container p-4">
        {!showSeed && (
          <button
            onClick={() => setShowSeed(true)}
            className="absolute inset-0 z-10 grid place-items-center backdrop-blur-md bg-background/60 rounded-2xl"
          >
            <div className="text-center">
              <Eye size={28} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-semibold">탭하여 시드 보기</p>
              <p className="text-xs text-on-surface-variant mt-1">주변에 사람이 없는지 확인하세요</p>
            </div>
          </button>
        )}
        <div className="grid grid-cols-3 gap-2">
          {words.map((w, i) => (
            <div
              key={i}
              className="rounded-lg bg-background border border-outline px-3 py-2 text-sm"
            >
              <span className="text-on-surface-variant text-[10px] mr-1.5 tnum">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono">{w}</span>
            </div>
          ))}
        </div>
        {showSeed && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowSeed(false)}
              className="flex-1 h-9 rounded-lg border border-outline text-xs flex items-center justify-center gap-1.5 hover:bg-surface"
            >
              <EyeOff size={14} /> 숨기기
            </button>
            <button
              onClick={async () => {
                const ok = await copyText(mnemonic);
                if (ok) {
                  toast.success(
                    "클립보드에 복사됨 — 즉시 안전한 곳에 보관하고 삭제하세요",
                  );
                } else {
                  toast.error(
                    "자동 복사 실패 — 시드 단어를 길게 눌러 수동 복사하세요",
                  );
                }
              }}
              className="flex-1 h-9 rounded-lg border border-outline text-xs flex items-center justify-center gap-1.5 hover:bg-surface"
            >
              <Copy size={14} /> 복사
            </button>
          </div>
        )}
      </div>

      <button
        disabled={!showSeed}
        onClick={onNext}
        className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        백업했어요, 다음
      </button>
    </div>
  );
}

function ConfirmSeedStep({
  mnemonic,
  onBack,
  onNext,
}: {
  mnemonic: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const words = mnemonic.split(" ");
  // 무작위 3개 위치를 골라 사용자에게 입력받음
  const challenges = useMemo(() => {
    const positions = new Set<number>();
    while (positions.size < 3) {
      positions.add(Math.floor(Math.random() * 12));
    }
    return Array.from(positions).sort((a, b) => a - b);
  }, []);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const allCorrect = challenges.every(
    (i) => (answers[i] ?? "").trim().toLowerCase() === words[i],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-on-surface-variant">
        백업이 잘 됐는지 확인할게요. 아래 단어 위치에 해당하는 단어를 입력하세요.
      </p>
      <div className="space-y-3">
        {challenges.map((idx) => (
          <label key={idx} className="block">
            <span className="text-xs text-on-surface-variant tnum">
              #{String(idx + 1).padStart(2, "0")} 번째 단어
            </span>
            <input
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={answers[idx] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
              className="mt-1 w-full h-11 rounded-lg border border-outline bg-surface px-3 font-mono text-sm focus:border-primary outline-none"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 h-12 rounded-xl border border-outline font-semibold hover:bg-surface-container transition"
        >
          시드 다시 보기
        </button>
        <button
          disabled={!allCorrect}
          onClick={onNext}
          className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition inline-flex items-center justify-center gap-2"
        >
          {allCorrect && <Check size={16} />} 다음
        </button>
      </div>
    </div>
  );
}

function PasswordStep({
  pw,
  setPw,
  pw2,
  setPw2,
  busy,
  onSubmit,
  submitLabel,
}: {
  pw: string;
  setPw: (v: string) => void;
  pw2: string;
  setPw2: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-on-surface-variant">
        이 비밀번호는 시드를 이 기기에서 암호화하는 데만 사용됩니다. 분실 시 시드 구문으로만 복구할 수 있습니다.
      </p>
      <label className="block">
        <span className="text-xs text-on-surface-variant">비밀번호 (8자 이상)</span>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-1 w-full h-11 rounded-lg border border-outline bg-surface px-3 text-sm focus:border-primary outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs text-on-surface-variant">비밀번호 확인</span>
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="mt-1 w-full h-11 rounded-lg border border-outline bg-surface px-3 text-sm focus:border-primary outline-none"
        />
      </label>
      <button
        disabled={busy || pw.length < 8 || pw !== pw2}
        onClick={onSubmit}
        className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        {busy ? "암호화 중..." : submitLabel}
      </button>
    </div>
  );
}

function RestoreStep({
  restorePhrase,
  setRestorePhrase,
  pw,
  setPw,
  pw2,
  setPw2,
  busy,
  onSubmit,
}: {
  restorePhrase: string;
  setRestorePhrase: (v: string) => void;
  pw: string;
  setPw: (v: string) => void;
  pw2: string;
  setPw2: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-xs text-on-surface-variant">
          시드 구문 (12단어, 공백으로 구분)
        </span>
        <textarea
          value={restorePhrase}
          onChange={(e) => setRestorePhrase(e.target.value)}
          rows={4}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="word1 word2 word3 ..."
          className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 font-mono text-sm focus:border-primary outline-none resize-none"
        />
      </label>
      <label className="block">
        <span className="text-xs text-on-surface-variant">새 비밀번호 (8자 이상)</span>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-1 w-full h-11 rounded-lg border border-outline bg-surface px-3 text-sm focus:border-primary outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs text-on-surface-variant">비밀번호 확인</span>
        <input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="mt-1 w-full h-11 rounded-lg border border-outline bg-surface px-3 text-sm focus:border-primary outline-none"
        />
      </label>
      <button
        disabled={busy}
        onClick={onSubmit}
        className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
      >
        {busy ? "복구 중..." : "지갑 복구"}
      </button>
    </div>
  );
}
