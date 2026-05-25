import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Gem, Send, QrCode, Activity, Settings, Link2 } from "lucide-react";
import { Logo } from "./Logo";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/wallet/", key: "nav.wallet", icon: Wallet },
  { to: "/points", key: "nav.points", icon: Gem },
  { to: "/wallet/send", key: "nav.send", icon: Send },
  { to: "/receive", key: "nav.receive", icon: QrCode },
  { to: "/connect", key: "nav.connect", icon: Link2 },
  { to: "/activity", key: "nav.activity", icon: Activity },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;

export function SidebarNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-outline bg-sidebar min-h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-outline">
        <Logo size={28} withTagline />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="render"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
