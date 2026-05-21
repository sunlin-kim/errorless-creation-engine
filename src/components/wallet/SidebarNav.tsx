import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  Gem,
  Send,
  QrCode,
  Activity,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./Logo";

const items = [
  { to: "/", label: "홈", icon: Home },
  { to: "/wallet", label: "내 지갑", icon: Wallet },
  { to: "/points", label: "포인트", icon: Gem },
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

    </aside>
  );
}
