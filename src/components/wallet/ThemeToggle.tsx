import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("sv-theme") : null;
    const isDark = stored ? stored === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setDark(!!isDark);
    document.documentElement.classList.toggle("dark", !!isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sv-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="테마 변경"
      className="h-10 w-10 rounded-full grid place-items-center border border-outline bg-surface hover:bg-surface-container transition-colors text-on-surface"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
