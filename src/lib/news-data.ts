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
    category: "기업",
    title: "제네시스 홀딩스 그룹, 금융·모바일·PPP·IPP로 사업 다각화 나서",
    excerpt:
      "제네시스 홀딩스 그룹이 금융, 모바일, PPP(민관협력), IPP(민자발전) 등으로 사업 영역을 확장하며 종합 그룹사로의 도약에 나섰다.",
    source: "한국경제TV",
    publishedAt: "2026-05-19T15:31:00+09:00",
    url: "https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202605190440&t=NN",
    thumb: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    id: "n4",
    type: "news",
    category: "수상",
    title: "제네시스핀, '2025 소비자 보호 사이버보안 우수기업' 중소벤처기업부 장관상 수상",
    excerpt:
      "블록체인 및 디지털 플랫폼 전문기업 제네시스핀이 디지털 신산업 분야 발전과 기술 혁신 공로로 2025년 중소벤처기업부 장관상을 수상했다.",
    source: "국민일보",
    publishedAt: "2025-12-29T11:05:00+09:00",
    url: "https://www.kmib.co.kr/article/view.asp?arcid=0029176445&code=61151111&cp=nv",
    thumb: "from-rose-500 via-red-500 to-amber-500",
  },
  {
    id: "n5",
    type: "news",
    category: "수상",
    title: "제네시스핀, 가상자산 기술 혁신·지역경제 활성화",
    excerpt:
      "모바일게임·블록체인 기술기업 제네시스핀이 '2025 행복더함 사회공헌 우수 기업' 사회책임공헌 부문 대상을 2년 연속 수상했다.",
    source: "한국경제",
    publishedAt: "2025-03-05T15:43:00+09:00",
    url: "https://www.hankyung.com/article/2025030531411",
    thumb: "from-emerald-600 to-teal-700",
  },
  {
    id: "n6",
    type: "news",
    category: "사회공헌",
    title: "제네시스핀, '2024 행복더함 사회공헌 캠페인' 사회책임공헌 부문 대상 수상",
    excerpt:
      "제네시스핀이 한국경영자총협회와 한국언론인협회가 공동 주최한 '2024 행복더함 사회공헌 캠페인'에서 사회책임공헌 부문 대상을 수상했다.",
    source: "매일경제",
    publishedAt: "2024-02-29T16:20:00+09:00",
    url: "https://www.mk.co.kr/news/business/10954068",
    thumb: "from-indigo-600 via-violet-600 to-fuchsia-500",
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
