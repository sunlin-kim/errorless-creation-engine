import logoDark from "@/assets/supervizion-logo-dark.png";
import logoLight from "@/assets/supervizion-logo-light.png";

type Props = { size?: number; withTagline?: boolean; className?: string };

export function Logo({ size = 40, className }: Props) {
  return (
    <div className={`flex items-center ${className ?? ""}`}>
      {/* Light mode: white background BI */}
      <img
        src={logoLight}
        alt="Supervizion"
        className="object-contain block dark:hidden"
        style={{ height: size, width: "auto" }}
      />
      {/* Dark mode: black background BI */}
      <img
        src={logoDark}
        alt="Supervizion"
        className="object-contain hidden dark:block"
        style={{ height: size, width: "auto" }}
      />
    </div>
  );
}
