import logoDark from "@/assets/supervizion-logo-dark.png";
import logoLight from "@/assets/supervizion-logo-light.png";

type Props = { size?: number; withTagline?: boolean; className?: string };

export function Logo({ size = 40, withTagline, className }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div
        className="relative shrink-0 rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_-12px_rgba(6,95,70,0.45)]"
        style={{ height: size, width: size }}
      >
        {/* Light mode: white background BI */}
        <img
          src={logoLight}
          alt="Supervizion"
          className="absolute inset-0 h-full w-full object-cover block dark:hidden"
        />
        {/* Dark mode: black background BI */}
        <img
          src={logoDark}
          alt="Supervizion"
          className="absolute inset-0 h-full w-full object-cover hidden dark:block"
        />
      </div>
      {withTagline && (
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-on-surface leading-none">
            Supervizion
          </p>
          <p className="mt-1 text-[10px] tracking-[0.22em] text-on-surface-variant uppercase">
            Premium Wallet
          </p>
        </div>
      )}
    </div>
  );
}
