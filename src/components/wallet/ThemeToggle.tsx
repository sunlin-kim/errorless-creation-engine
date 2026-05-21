import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("sv-theme");
    const next = stored
      ? stored === "dark"
      : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
    setDark(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(dark);
  }, [dark, mounted]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("sv-theme", next ? "dark" : "light");
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      aria-label="테마 변경"
      type="button"
      className="h-10 w-10 rounded-full grid place-items-center border border-outline bg-surface hover:bg-surface-container transition-colors text-on-surface"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
