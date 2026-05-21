import type { TxStatus } from "@/lib/wallet-data";

const styles: Record<TxStatus, string> = {
  success: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  failed: "bg-destructive/15 text-destructive",
};

const labels: Record<TxStatus, string> = {
  success: "완료",
  pending: "진행 중",
  failed: "실패",
};

export function TxStatusBadge({ status }: { status: TxStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
