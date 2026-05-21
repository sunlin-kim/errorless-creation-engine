import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("sv-theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("sv-theme", next ? "dark" : "light");
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="테마 변경"
      type="button"
      className="h-10 w-10 rounded-full grid place-items-center border border-outline bg-surface hover:bg-surface-container transition-colors text-on-surface"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
