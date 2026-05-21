import { Newspaper, PlayCircle, ExternalLink, Clock } from "lucide-react";

export type NewsItem = {
  id: string;
  type: "news" | "video";
  category: string;
  title: string;
  source: string;
  publishedAt: string; // ISO
  url: string;
  thumb?: string; // gradient seed
  duration?: string; // for videos
};

export const newsFeed: NewsItem[] = [
  {
    id: "n1",
    type: "news",
    category: "공지",
    title: "Supervizion, 가상자산이용자보호법 2차 시행 대응 완료",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-21T08:30:00+09:00",
    url: "https://supervizion.io/news/vaupa-phase2",
    thumb: "from-emerald-500 to-teal-600",
  },
  {
    id: "n2",
    type: "video",
    category: "에듀케이션",
    title: "트래블룰 한눈에 보기 — 100만 원 이상 송금 시 체크포인트",
    source: "Supervizion Academy",
    publishedAt: "2026-05-20T18:00:00+09:00",
    url: "https://www.youtube.com/watch?v=travelrule",
    thumb: "from-indigo-500 to-emerald-500",
    duration: "06:42",
  },
  {
    id: "n3",
    type: "news",
    category: "마켓",
    title: "비트코인 현물 ETF 순유입 14주 연속 — 기관 매수세 지속",
    source: "CoinDesk Korea",
    publishedAt: "2026-05-21T07:10:00+09:00",
    url: "https://www.coindeskkorea.com/",
    thumb: "from-amber-500 to-rose-500",
  },
  {
    id: "n4",
    type: "news",
    category: "보안",
    title: "피싱 DApp 주의보 — 가짜 에어드랍 사이트 5종 식별",
    source: "Supervizion Security",
    publishedAt: "2026-05-19T11:20:00+09:00",
    url: "https://supervizion.io/security/phishing-0519",
    thumb: "from-rose-500 to-orange-500",
  },
  {
    id: "n5",
    type: "video",
    category: "리포트",
    title: "이번 주 온체인 데이터 — 스테이블코인 공급량 사상 최대",
    source: "Supervizion Research",
    publishedAt: "2026-05-18T20:00:00+09:00",
    url: "https://www.youtube.com/watch?v=onchain-weekly",
    thumb: "from-sky-500 to-emerald-500",
    duration: "12:08",
  },
  {
    id: "n6",
    type: "news",
    category: "업데이트",
    title: "v2.4 릴리즈 — Base·Linea 네트워크 정식 지원",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-17T10:00:00+09:00",
    url: "https://supervizion.io/changelog/v2-4",
    thumb: "from-emerald-600 to-lime-500",
  },
];

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

export { Newspaper, PlayCircle, ExternalLink, Clock };
