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
};

const brand: Tile[] = [
  { id: "home", label: "홈페이지", icon: Home, href: "https://supervizion.io" },
  { id: "blog", label: "블로그", icon: BookOpen, href: "#" },
  { id: "youtube", label: "유튜브", icon: Youtube, href: "#" },
];

const services: Tile[] = [
  { id: "mainnet", label: "MainNet 기술", icon: Network },
  { id: "ipp", label: "IPP", icon: Zap },
  { id: "mall", label: "모바일 Mall", icon: ShoppingBag },
  { id: "leisure", label: "레저와 여행", icon: Plane },
  { id: "ppp", label: "PPP", icon: Building2 },
  { id: "research", label: "경영연구원", icon: GraduationCap },
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
      <div className="h-16 w-16 rounded-full border border-outline bg-surface grid place-items-center transition-all group-hover:border-primary/50 group-hover:bg-primary/5">
        <Icon
          size={28}
          strokeWidth={1.5}
          className="text-on-surface group-hover:text-primary transition-colors"
        />
      </div>
      <span className="text-xs font-medium text-on-surface text-center leading-tight">
        {tile.label}
      </span>
    </Wrapper>
  );
}
