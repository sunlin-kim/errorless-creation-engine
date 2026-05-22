import { Link } from "@tanstack/react-router";
import { Send, QrCode, ArrowLeftRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import vizionPowerLight from "@/assets/vizion-power-light.png";
import vizionPowerDark from "@/assets/vizion-power-dark.png";

type Action = {
  to: string;
  label: string;
  icon?: typeof Send;
  image?: { light: string; dark: string };
};

const actions: Action[] = [
  { to: "/send", label: "보내기", icon: Send },
  { to: "/receive", label: "받기", icon: QrCode },
  { to: "/activity", label: "스왑", icon: ArrowLeftRight },
  {
    to: "/settings",
    label: "Vizion Power",
    image: { light: vizionPowerLight, dark: vizionPowerDark },
  },
];

export function QuickActions() {
  const isMobile = useIsMobile();

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const { to, label, icon: Icon, image } = action;
        const content = (
          <>
            <span className="h-11 w-11 rounded-full grid place-items-center bg-primary-container text-on-primary-container group-hover:bg-primary group-hover:text-white transition-colors overflow-hidden">
              {Icon ? (
                <Icon size={18} />
              ) : image ? (
                <>
                  <img
                    src={image.light}
                    alt={label}
                    className="h-full w-full object-cover block dark:hidden"
                  />
                  <img
                    src={image.dark}
                    alt={label}
                    className="h-full w-full object-cover hidden dark:block"
                  />
                </>
              ) : null}
            </span>
            <span className="text-xs font-medium text-on-surface">{label}</span>
          </>
        );
        const className =
          "group flex flex-col items-center gap-2 rounded-2xl border border-outline bg-surface hover:bg-primary-container hover:border-primary/30 transition-colors p-4";
        if (label === "Vizion Power") {
          return (
            <div key={label} className={className} aria-disabled="true">
              {content}
            </div>
          );
        }
        return (
          <Link
            key={label}
            to={isMobile && to === "/activity" ? "/wallet" : to}
            preload="intent"
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
