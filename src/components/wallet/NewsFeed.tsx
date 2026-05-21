import { newsFeed, relativeTime } from "@/lib/news-data";
import { Newspaper, PlayCircle, ExternalLink, Clock, ChevronRight } from "lucide-react";

const categories = ["전체", "공지", "마켓", "보안", "에듀케이션", "리포트", "업데이트"];

export function NewsFeed() {
  const featured = newsFeed[0];
  const rest = newsFeed.slice(1);

  return (
    <section className="rounded-3xl border border-outline bg-surface p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 grid place-items-center rounded-full bg-primary-container text-on-primary-container">
            <Newspaper size={15} />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-none">소식</h2>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Supervizion이 큐레이션하는 디지털 자산 뉴스 · 영상
            </p>
          </div>
        </div>
        <button className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
          전체 보기 <ChevronRight size={14} />
        </button>
      </header>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c, i) => (
          <button
            key={c}
            className={`shrink-0 px-3 h-7 rounded-full text-xs font-medium transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Featured card */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl overflow-hidden border border-outline bg-surface-container hover:border-primary/40 transition-colors"
      >
        <div
          className={`relative h-36 bg-gradient-to-br ${featured.thumb} grid place-items-center`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          {featured.type === "video" && (
            <PlayCircle size={48} className="relative text-white drop-shadow-lg" />
          )}
          <span className="absolute top-3 left-3 text-[10px] tracking-[0.18em] font-semibold uppercase px-2 py-1 rounded-full bg-black/30 text-white backdrop-blur">
            {featured.category}
          </span>
          {featured.duration && (
            <span className="absolute bottom-3 right-3 tnum text-[11px] px-1.5 py-0.5 rounded bg-black/55 text-white">
              {featured.duration}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors">
            {featured.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-on-surface-variant">
            <span>{featured.source}</span>
            <span>·</span>
            <Clock size={11} />
            <span className="tnum">{relativeTime(featured.publishedAt)}</span>
            <ExternalLink size={11} className="ml-auto" />
          </div>
        </div>
      </a>

      {/* List */}
      <div className="mt-3 divide-y divide-[color:var(--outline)]/40">
        {rest.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 py-3 first:pt-3"
          >
            <div
              className={`relative h-14 w-20 shrink-0 rounded-xl bg-gradient-to-br ${item.thumb} grid place-items-center overflow-hidden`}
            >
              {item.type === "video" ? (
                <PlayCircle size={20} className="text-white" />
              ) : (
                <Newspaper size={18} className="text-white/90" />
              )}
              {item.duration && (
                <span className="absolute bottom-1 right-1 tnum text-[9px] px-1 rounded bg-black/55 text-white">
                  {item.duration}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] tracking-wider font-semibold uppercase text-primary">
                  {item.category}
                </span>
                <span className="text-[10px] text-on-surface-variant">·</span>
                <span className="text-[10px] text-on-surface-variant tnum">
                  {relativeTime(item.publishedAt)}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant truncate">
                {item.source}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
