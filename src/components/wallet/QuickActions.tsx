import { Link } from "@tanstack/react-router";
import { Send, QrCode, ArrowLeftRight, Sparkles } from "lucide-react";

const actions = [
  { to: "/send", label: "보내기", icon: Send },
  { to: "/receive", label: "받기", icon: QrCode },
  { to: "/activity", label: "스왑", icon: ArrowLeftRight },
  { to: "/settings", label: "스테이킹", icon: Sparkles },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ to, label, icon: Icon }) => (
        <Link
          key={label}
          to={to}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-outline bg-surface hover:bg-primary-container hover:border-primary/30 transition-colors p-4"
        >
          <span className="h-11 w-11 rounded-full grid place-items-center bg-primary-container text-on-primary-container group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon size={18} />
          </span>
          <span className="text-xs font-medium text-on-surface">{label}</span>
        </Link>
      ))}
    </div>
  );
}
