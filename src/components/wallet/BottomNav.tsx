import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Gem, Settings } from "lucide-react";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/", key: "nav.home", icon: Home, match: (p: string) => p === "/" },
  { to: "/wallet", key: "nav.wallet", icon: Wallet, match: (p: string) => p.startsWith("/wallet") || p.startsWith("/asset") || p.startsWith("/send") || p.startsWith("/receive") },
  { to: "/points", key: "nav.points", icon: Gem, match: (p: string) => p.startsWith("/points") },
  { to: "/settings", key: "nav.settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const path = location.pathname;
  const t = useT();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-outline bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label={t("nav.mobile")}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const active = it.match(path);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className="group relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2"
              >
                <span
                  className={`relative grid place-items-center h-10 w-12 rounded-2xl transition-all ${
                    active
                      ? "bg-primary-container/70 text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {active && (
                    <span className="absolute -top-1 h-1 w-7 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.2 : 1.7}
                    className={
                      active
                        ? "drop-shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                        : ""
                    }
                  />
                </span>
                <span
                  className={`text-[10px] tracking-wide ${
                    active
                      ? "text-primary font-semibold"
                      : "text-on-surface-variant"
                  }`}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
