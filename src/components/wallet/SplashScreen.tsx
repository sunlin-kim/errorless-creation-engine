import { useEffect, useState } from "react";
import splashLogo from "@/assets/splash-logo.png";

const SESSION_KEY = "sv-splash-shown";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    setVisible(true);
    const fadeT = setTimeout(() => setFading(true), 2200);
    const hideT = setTimeout(() => setVisible(false), 2800);
    return () => {
      clearTimeout(fadeT);
      clearTimeout(hideT);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
      aria-hidden="true"
    >
      {/* Logo (screen blend lets the image's own dark backdrop merge with the page background) */}
      <img
        src={splashLogo}
        alt=""
        className="splash-logo relative z-10 w-[78%] max-w-[420px] select-none"
        style={{ mixBlendMode: "screen" }}
        draggable={false}
      />

      <style>{`
        @keyframes splashGradientPulse {
          0% { opacity: 0; transform: scale(0.6); }
          40% { opacity: 1; transform: scale(1.05); }
          70% { opacity: 0.85; transform: scale(1); }
          100% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes splashLogoIn {
          0% { opacity: 0; transform: scale(0.85); filter: blur(12px) brightness(1.6); }
          55% { opacity: 1; transform: scale(1.03); filter: blur(0) brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: blur(0) brightness(1); }
        }
        @keyframes splashShimmer {
          0% { background-position: -150% 0; }
          100% { background-position: 250% 0; }
        }
        .splash-gradient-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(34,197,94,0.55) 0%, rgba(16,185,129,0.25) 25%, rgba(0,0,0,0) 60%),
            radial-gradient(circle at 50% 50%, rgba(74,222,128,0.35) 0%, rgba(0,0,0,0) 45%);
          animation: splashGradientPulse 2.4s ease-out forwards;
          filter: blur(20px);
        }
        .splash-logo {
          animation: splashLogoIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 28px rgba(34,197,94,0.55)) drop-shadow(0 0 60px rgba(16,185,129,0.35));
        }
        .splash-logo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: splashShimmer 1.8s ease-in-out 0.3s both;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
