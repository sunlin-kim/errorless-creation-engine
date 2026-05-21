import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Send,
  QrCode,
  Activity,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./Logo";

const items = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/send", label: "보내기", icon: Send },
  { to: "/receive", label: "받기", icon: QrCode },
  { to: "/activity", label: "거래내역", icon: Activity },
  { to: "/settings", label: "설정", icon: Settings },
];

export function SidebarNav() {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-outline bg-sidebar min-h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-outline">
        <Logo size={28} withTagline />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active =
            item.to === "/" ? path === "/" : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-premium/40 bg-gradient-to-br from-[color:var(--premium)]/10 to-transparent p-4">
        <div className="flex items-center gap-2 text-premium text-xs font-semibold tracking-wider">
          <ShieldCheck size={14} /> PREMIUM
        </div>
        <p className="mt-2 text-xs text-on-surface-variant leading-relaxed">
          가상자산이용자보호법 §6·§7에 따라 예치금 분리보관 및 동일종목·수량
          보관이 적용됩니다.
        </p>
      </div>
    </aside>
  );
}
