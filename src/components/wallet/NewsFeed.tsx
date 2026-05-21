import { useState } from "react";
import { featuredNews, newsFeed, insights, relativeTime, type NewsItem } from "@/lib/news-data";
import {
  PlayCircle,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

type Tab = "news" | "insight";

export function NewsFeed() {
  const [tab, setTab] = useState<Tab>("news");
  const [slide, setSlide] = useState(0);

  const items = tab === "news" ? newsFeed : insights;
  const featured = featuredNews;

  const next = () => setSlide((s) => (s + 1) % featured.length);
  const prev = () =>
    setSlide((s) => (s - 1 + featured.length) % featured.length);

  return (
    <section className="rounded-3xl border border-outline bg-surface overflow-hidden">
      {/* Tabs */}
      <div className="px-5 pt-5 flex items-end gap-6 border-b border-outline">
        {([
          { id: "news", label: "소식" },
          { id: "insight", label: "인사이트" },
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-lg font-bold transition-colors ${
                active ? "text-on-surface" : "text-on-surface-variant/60"
              }`}
            >
              {t.label}
              {active && (
                <span className="absolute -bottom-px left-0 right-0 h-[3px] rounded-full bg-on-surface" />
              )}
            </button>
          );
        })}
      </div>

      {/* Featured hero carousel */}
      {tab === "news" && (
        <div className="p-5">
          <div className="relative rounded-2xl overflow-hidden group">
            <a
              href={featured[slide].url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div
                className={`relative aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-br ${featured[slide].thumb}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {featured[slide].type === "video" && (
                  <PlayCircle
                    size={64}
                    className="absolute inset-0 m-auto text-white drop-shadow-2xl"
                  />
                )}
                <span className="absolute top-4 left-4 text-[10px] tracking-[0.2em] font-semibold uppercase px-2.5 py-1 rounded-full bg-white/15 text-white backdrop-blur">
                  {featured[slide].category}
                </span>
                {featured[slide].duration && (
                  <span className="absolute top-4 right-4 tnum text-[11px] px-2 py-1 rounded bg-black/55 text-white">
                    {featured[slide].duration}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-xl sm:text-2xl font-bold leading-snug drop-shadow">
                    {featured[slide].title}
                  </h3>
                  <p className="mt-2 text-xs text-white/75">
                    {featured[slide].source} · {relativeTime(featured[slide].publishedAt)}
                  </p>
                </div>
              </div>
            </a>

            {/* Arrows */}
            <button
              onClick={prev}
              aria-label="이전"
              className="absolute top-1/2 -translate-y-1/2 left-2 h-9 w-9 rounded-full grid place-items-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="다음"
              className="absolute top-1/2 -translate-y-1/2 right-2 h-9 w-9 rounded-full grid place-items-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                  aria-label={`슬라이드 ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Promo banner */}
          <a
            href="#"
            className="mt-4 block rounded-2xl overflow-hidden relative bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 text-white"
          >
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-white/80">
                  <ShoppingBag size={12} /> EP
                </div>
                <p className="mt-1.5 text-sm text-white/85">
                  생활에 플러스가 되는 에너지 포인트 EP
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-yellow-300 leading-tight">
                  EP를 시작하세요!
                </p>
              </div>
              <Sparkles size={42} className="shrink-0 text-yellow-300 drop-shadow" />
            </div>
            <div className="absolute bottom-2 left-5 flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </a>
        </div>
      )}

      {/* List */}
      <div className="px-5 pb-5">
        <h3 className="text-sm font-semibold text-on-surface-variant mb-3 mt-1">
          {tab === "news" ? "새 소식" : "최신 인사이트"}
        </h3>
        <div className="space-y-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-outline bg-surface-container overflow-hidden hover:border-primary/40 transition-colors"
    >
      <div
        className={`relative aspect-[16/9] bg-gradient-to-br ${item.thumb}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        {item.type === "video" ? (
          <PlayCircle
            size={48}
            className="absolute inset-0 m-auto text-white drop-shadow-lg"
          />
        ) : (
          <Newspaper
            size={28}
            className="absolute top-4 right-4 text-white/80"
          />
        )}
        <span className="absolute top-3 left-3 text-[10px] tracking-[0.18em] font-semibold uppercase px-2 py-1 rounded-full bg-black/35 text-white backdrop-blur">
          {item.category}
        </span>
        {item.duration && (
          <span className="absolute bottom-3 right-3 tnum text-[11px] px-1.5 py-0.5 rounded bg-black/55 text-white">
            {item.duration}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] text-on-surface-variant tnum">
          {relativeTime(item.publishedAt)}
        </p>
        <h4 className="mt-1.5 font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h4>
        {item.excerpt && (
          <p className="mt-2 text-[13px] text-on-surface-variant leading-relaxed line-clamp-3">
            {item.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">
            {item.source}
          </span>
          <span className="text-xs font-semibold text-primary">더보기 →</span>
        </div>
      </div>
    </a>
  );
}
