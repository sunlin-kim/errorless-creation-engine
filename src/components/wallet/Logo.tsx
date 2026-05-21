import logo from "@/assets/supervizion-logo.png";

type Props = { size?: number; withTagline?: boolean; className?: string };

export function Logo({ size = 36, withTagline = false, className }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div
        className="rounded-xl bg-[#071F18] grid place-items-center shrink-0 brand-glow"
        style={{ height: size, width: size }}
      >
        <img
          src={logo}
          alt="Supervizion"
          className="object-contain"
          style={{ height: size * 0.78, width: size * 0.78 }}
        />
      </div>
      {withTagline && (
        <div className="hidden sm:block leading-tight">
          <div className="text-sm font-semibold tracking-tight text-on-surface">
            super vizion
          </div>
          <div className="text-[9px] tracking-[0.28em] text-[color:var(--tertiary)] uppercase mt-0.5">
            See Beyond · Lead Ahead
          </div>
        </div>
      )}
    </div>
  );
}
