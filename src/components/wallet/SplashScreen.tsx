import { useEffect, useState } from "react";
import splashLogo from "@/assets/splash-logo.png";

const SESSION_KEY = "sv-splash-shown";

export function SplashScreen() {
  // Only show the splash once per browser tab (first load).
  // Default to hidden so SSR + refreshes never flash the logo;
  // we opt-in on the client only when sessionStorage shows no prior view.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let shown = false;
    try {
      shown = !!sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (shown) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setMounted(true);
    const t = setTimeout(() => setMounted(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="splash-root" aria-hidden="true">
      <img
        src={splashLogo}
        alt=""
        fetchPriority="high"
        decoding="sync"
        className="splash-logo"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />

      <style>{`
        @keyframes splashFadeOut {
          0%, 78% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }
        @keyframes splashLogoIn {
          0% { opacity: 0; transform: scale(0.85); filter: blur(12px) brightness(1.6); }
          55% { opacity: 1; transform: scale(1.03); filter: blur(0) brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: blur(0) brightness(1); }
        }
        .splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          animation: splashFadeOut 2.8s ease forwards;
          pointer-events: none;
        }
        .splash-logo {
          position: relative;
          z-index: 10;
          width: 78%;
          max-width: 420px;
          user-select: none;
          animation: splashLogoIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 28px rgba(34,197,94,0.55)) drop-shadow(0 0 60px rgba(16,185,129,0.35));
        }
      `}</style>
    </div>
  );
}
