import logo from "@/assets/supervizion-logo.png";

type Props = { size?: number; withTagline?: boolean; className?: string };

export function Logo({ size = 32, withTagline = false, className }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <img
        src={logo}
        alt="Supervizion"
        width={size * 1.4}
        height={size}
        className="object-contain"
        style={{ height: size, width: "auto" }}
      />
      {withTagline && (
        <div className="hidden sm:block">
          <div className="text-[10px] tracking-[0.3em] text-[color:var(--tertiary)] uppercase">
            See Beyond · Lead Ahead
          </div>
        </div>
      )}
    </div>
  );
}
