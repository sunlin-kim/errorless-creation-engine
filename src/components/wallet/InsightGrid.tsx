import {
  Home,
  BookOpen,
  Youtube,
  Network,
  Zap,
  ShoppingBag,
  Plane,
  Building2,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

type Tile = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  // Tailwind classes for icon color, border tint, background tint
  color: string;
  border: string;
  bg: string;
};

const brand: Tile[] = [
  {
    id: "home",
    label: "홈페이지",
    icon: Home,
    href: "https://supervizion.io",
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  {
    id: "blog",
    label: "블로그",
    icon: BookOpen,
    href: "#",
    color: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  {
    id: "youtube",
    label: "유튜브",
    icon: Youtube,
    href: "#",
    color: "text-red-500",
    border: "border-red-200",
    bg: "bg-red-50",
  },
];

const services: Tile[] = [
  {
    id: "mainnet",
    label: "MainNet 기술",
    icon: Network,
    href: "https://genesisfin.ai/",
    color: "text-indigo-600",
    border: "border-indigo-200",
    bg: "bg-indigo-50",
  },
  {
    id: "ipp",
    label: "IPP",
    icon: Zap,
    href: "https://genesisipp.com/",
    color: "text-yellow-500",
    border: "border-yellow-200",
    bg: "bg-yellow-50",
  },
  {
    id: "mall",
    label: "모바일 Mall",
    icon: ShoppingBag,
    href: "https://genesismobile.shop/",
    color: "text-pink-500",
    border: "border-pink-200",
    bg: "bg-pink-50",
  },
  {
    id: "leisure",
    label: "레저와 여행",
    icon: Plane,
    href: "https://genesislj.com/",
    color: "text-sky-500",
    border: "border-sky-200",
    bg: "bg-sky-50",
  },
  {
    id: "ppp",
    label: "PPP",
    icon: Building2,
    href: "https://genesisppp.com/",
    color: "text-teal-600",
    border: "border-teal-200",
    bg: "bg-teal-50",
  },
  {
    id: "research",
    label: "경영연구원",
    icon: GraduationCap,
    color: "text-violet-600",
    border: "border-violet-200",
    bg: "bg-violet-50",
  },
];

export function InsightGrid() {
  return (
    <div className="space-y-6 p-5">
      <Section title="Supervizion" tiles={brand} />
      <Section title="Our Service" tiles={services} />
    </div>
  );
}

function Section({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section>
      <h3 className="text-sm font-bold tracking-wide text-on-surface mb-3 px-1">
        {title}
      </h3>
      <div className="rounded-3xl border border-outline bg-surface-container p-5">
        <div className="grid grid-cols-3 gap-y-6 gap-x-2">
          {tiles.map((t) => (
            <TileItem key={t.id} tile={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TileItem({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  const Wrapper: React.ElementType = tile.href ? "a" : "div";
  const wrapperProps = tile.href
    ? { href: tile.href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex flex-col items-center gap-2 cursor-pointer"
    >
      <div
        className={`h-16 w-16 rounded-full border ${tile.border} ${tile.bg} grid place-items-center transition-all group-hover:scale-105 group-hover:shadow-sm`}
      >
        <Icon
          size={28}
          strokeWidth={1.75}
          className={`${tile.color} transition-colors`}
        />
      </div>
      <span className="text-xs font-medium text-on-surface text-center leading-tight">
        {tile.label}
      </span>
    </Wrapper>
  );
}
