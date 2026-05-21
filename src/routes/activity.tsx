import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { transactions, type TxKind, type TxStatus } from "@/lib/wallet-data";
import { TxRow } from "@/components/wallet/TxRow";
import { useState } from "react";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

const filters: { id: TxKind | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "send", label: "보냄" },
  { id: "receive", label: "받음" },
  { id: "swap", label: "스왑" },
  { id: "stake", label: "스테이킹" },
];
const statuses: { id: TxStatus | "all"; label: string }[] = [
  { id: "all", label: "모든 상태" },
  { id: "success", label: "완료" },
  { id: "pending", label: "진행 중" },
  { id: "failed", label: "실패" },
];

function ActivityPage() {
  const [kind, setKind] = useState<TxKind | "all">("all");
  const [status, setStatus] = useState<TxStatus | "all">("all");
  const filtered = transactions.filter(
    (t) => (kind === "all" || t.kind === kind) && (status === "all" || t.status === status),
  );

  return (
    <AppShell title="거래내역" subtitle="모든 체인의 송수신·스왑·스테이킹 활동">
      <div className="rounded-3xl border border-outline bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setKind(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                kind === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-outline text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-2 h-5 w-px bg-outline" />
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                status === s.id
                  ? "bg-primary-container text-on-primary-container border-primary/40"
                  : "border-outline text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 divide-y divide-[color:var(--outline)]/40">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-on-surface-variant">
              조건에 맞는 거래가 없습니다.
            </p>
          )}
          {filtered.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
