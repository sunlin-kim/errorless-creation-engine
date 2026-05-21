import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { hasVault } from "@/lib/wallet/vault";

export const Route = createFileRoute("/wallet/unlock")({
  component: UnlockPage,
});

function UnlockPage() {
  const navigate = useNavigate();

  useEffect(() => {
    hasVault().then((exists) => {
      navigate({ to: exists ? "/wallet" : "/wallet/setup" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-5">
      <p className="text-sm text-on-surface-variant">지갑 화면으로 이동 중…</p>
    </div>
  );
}
