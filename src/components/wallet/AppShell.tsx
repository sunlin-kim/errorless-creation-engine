import type { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { Bell, Search } from "lucide-react";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex bg-background text-on-surface">
      <SidebarNav />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-outline">
          <div className="px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden">
                <Logo size={26} />
              </div>
              {title && (
                <div className="hidden lg:block min-w-0">
                  <h1 className="text-lg font-semibold truncate">{title}</h1>
                  {subtitle && (
                    <p className="text-xs text-on-surface-variant truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 h-10 px-3 rounded-full border border-outline bg-surface text-sm text-on-surface-variant w-64">
                <Search size={14} />
                <span>자산·주소·트랜잭션 검색</span>
              </div>
              <button
                aria-label="알림"
                className="h-10 w-10 rounded-full grid place-items-center border border-outline bg-surface hover:bg-surface-container text-on-surface relative"
              >
                <Bell size={16} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-warning" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {title && (
            <div className="lg:hidden px-5 pb-4">
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
              )}
            </div>
          )}
        </header>

        <div className="px-5 lg:px-8 py-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
