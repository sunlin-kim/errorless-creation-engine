import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sparkles } from "lucide-react";
import { type Tx, fmtKrw, fmtNum } from "@/lib/wallet-data";
import { TxStatusBadge } from "./TxStatusBadge";

const kindIcon = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  swap: ArrowLeftRight,
  stake: Sparkles,
} as const;

const kindLabel = {
  send: "보냄",
  receive: "받음",
  swap: "스왑",
  stake: "스테이킹",
} as const;

export function TxRow({ tx }: { tx: Tx }) {
  const Icon = kindIcon[tx.kind];
  const time = new Date(tx.timestamp).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-colors">
      <span className="h-10 w-10 rounded-full grid place-items-center bg-primary-container text-on-primary-container">
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-on-surface">{kindLabel[tx.kind]}</p>
          <TxStatusBadge status={tx.status} />
        </div>
        <p className="text-xs text-on-surface-variant truncate tnum">
          {tx.counterparty} · {tx.network}
        </p>
      </div>
      <div className="text-right">
        <p className="tnum text-sm font-medium">
          {tx.kind === "send" ? "-" : tx.kind === "receive" ? "+" : ""}
          {fmtNum(tx.amount, 4)} {tx.asset}
        </p>
        <p className="text-[11px] text-on-surface-variant tnum">
          수수료 {fmtKrw(tx.feeKrw)} · {time}
        </p>
      </div>
    </div>
  );
}
