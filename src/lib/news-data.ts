export type NewsItem = {
  id: string;
  type: "news" | "video";
  category: string;
  title: string;
  excerpt?: string;
  source: string;
  publishedAt: string; // ISO
  url: string;
  thumb?: string; // gradient seed
  duration?: string;
};

export const featuredNews: NewsItem[] = [
  {
    id: "f1",
    type: "news",
    category: "런칭 이벤트",
    title: "SPC SLC 공식 런칭 — 새로운 시작을 함께하세요",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-20T19:00:00+09:00",
    url: "https://supervizion.io/events/spc-slc-launch",
    thumb: "from-indigo-800 via-violet-700 to-fuchsia-500",
  },
  {
    id: "f2",
    type: "news",
    category: "파트너십",
    title: "Supervizion × 글로벌 결제 네트워크 MOU 체결",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-18T10:00:00+09:00",
    url: "https://supervizion.io/news/mou",
    thumb: "from-emerald-700 via-teal-600 to-cyan-500",
  },
  {
    id: "f3",
    type: "video",
    category: "리포트",
    title: "2026 디지털 자산 시장 — 상반기 결산 영상",
    source: "Supervizion Research",
    publishedAt: "2026-05-15T12:00:00+09:00",
    url: "https://www.youtube.com/watch?v=h1-recap",
    thumb: "from-indigo-700 via-violet-600 to-emerald-500",
    duration: "08:24",
  },
];

export const newsFeed: NewsItem[] = [
  {
    id: "n1",
    type: "news",
    category: "공지",
    title: "Supervizion, 가상자산이용자보호법 2차 시행 대응 완료",
    excerpt:
      "이용자 예치금 분리보관, 이상거래 상시 감시 체계 고도화 등 2차 시행에 맞춘 전사 대응을 완료했습니다.",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-21T08:30:00+09:00",
    url: "https://supervizion.io/news/vaupa-phase2",
    thumb: "from-emerald-600 to-teal-700",
  },
  {
    id: "n2",
    type: "news",
    category: "파트너십",
    title:
      "바타안경제특구청(AFAB), 산업 및 인력개발 프로젝트를 위해 Supervizion글로벌(주)와 전략적 파트너십 체결",
    excerpt:
      "바타안경제특구청(AFAB)은 5월 14일 필리핀 바탄 마리벨레스 본청에서 한국의 Supervizion글로벌(주) 및 글로벌인재교육개발원(GHRDI)과 산업…",
    source: "Supervizion Global",
    publishedAt: "2026-05-17T09:00:00+09:00",
    url: "https://supervizion.io/news/afab",
    thumb: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    id: "n3",
    type: "news",
    category: "협약",
    title:
      "글로벌인재교육개발원, 키르기스스탄 교육부와 교육협력 업무협약 체결",
    excerpt:
      "글로벌인재교육개발원(대표 최인선)이 지난 26일 키르기스공화국 교육부(차관 Dzhusupbekova Nadria Syntashevna)와 포괄적인 교육협력을…",
    source: "GHRDI",
    publishedAt: "2026-05-12T11:00:00+09:00",
    url: "https://supervizion.io/news/ghrdi-kg",
    thumb: "from-rose-500 via-red-500 to-amber-500",
  },
  {
    id: "n4",
    type: "video",
    category: "에듀케이션",
    title: "트래블룰 한눈에 보기 — 100만 원 이상 송금 시 체크포인트",
    excerpt:
      "송금 금액별 검증 절차와 수취인 정보 입력 요건을 6분 영상으로 정리했습니다.",
    source: "Supervizion Academy",
    publishedAt: "2026-05-10T18:00:00+09:00",
    url: "https://www.youtube.com/watch?v=travelrule",
    thumb: "from-indigo-600 to-emerald-500",
    duration: "06:42",
  },
  {
    id: "n5",
    type: "news",
    category: "마켓",
    title: "비트코인 현물 ETF 순유입 14주 연속 — 기관 매수세 지속",
    excerpt:
      "5월 셋째 주 비트코인 현물 ETF에 약 12억 달러가 순유입되며 14주 연속 유입 흐름이 이어졌습니다.",
    source: "CoinDesk Korea",
    publishedAt: "2026-05-09T07:10:00+09:00",
    url: "https://www.coindeskkorea.com/",
    thumb: "from-amber-500 to-rose-500",
  },
  {
    id: "n6",
    type: "news",
    category: "업데이트",
    title: "v2.4 릴리즈 — Base · Linea 네트워크 정식 지원",
    excerpt:
      "Base와 Linea 메인넷에서 송금·수신·스왑·자산 추적이 정식 지원됩니다.",
    source: "Supervizion Newsroom",
    publishedAt: "2026-05-07T10:00:00+09:00",
    url: "https://supervizion.io/changelog/v2-4",
    thumb: "from-emerald-600 to-lime-500",
  },
];

export const insights: NewsItem[] = [
  {
    id: "i1",
    type: "news",
    category: "리서치",
    title: "온체인 데이터로 본 스테이블코인 시장 — 공급량 사상 최대",
    excerpt:
      "USDT·USDC를 비롯한 주요 스테이블코인 공급량이 2,300억 달러를 돌파했습니다.",
    source: "Supervizion Research",
    publishedAt: "2026-05-19T12:00:00+09:00",
    url: "https://supervizion.io/insight/stablecoin-supply",
    thumb: "from-sky-600 to-emerald-500",
  },
  {
    id: "i2",
    type: "video",
    category: "인터뷰",
    title: "프리미엄 자산 관리, 어디까지 자동화할 수 있는가",
    source: "Supervizion Studio",
    publishedAt: "2026-05-13T16:00:00+09:00",
    url: "https://www.youtube.com/watch?v=automation",
    thumb: "from-violet-700 to-emerald-500",
    duration: "14:50",
  },
  {
    id: "i3",
    type: "news",
    category: "규제",
    title: "가상자산이용자보호법 2차 시행 — 사업자가 준비해야 할 7가지",
    excerpt:
      "분리보관·이상거래 감시·트래블룰 등 핵심 7개 항목을 체크리스트로 정리했습니다.",
    source: "Supervizion Legal",
    publishedAt: "2026-05-08T09:30:00+09:00",
    url: "https://supervizion.io/insight/vaupa-checklist",
    thumb: "from-emerald-700 to-teal-600",
  },
];

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
