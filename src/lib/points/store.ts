/**
 * Supervizion Rewards 포인트 — 로컬 영구 저장(zustand persist).
 * 적립/사용/전환/일일출석 기능을 제공한다.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PointTxType = "earn" | "spend" | "convert" | "checkin" | "redeem";

export interface PointTx {
  id: string;
  label: string;
  amount: number; // + 적립, - 사용
  type: PointTxType;
  createdAt: number;
}

export interface RewardItem {
  id: string;
  label: string;
  cost: number;
  tag?: string;
}

export const REWARDS: RewardItem[] = [
  { id: "r1", label: "휴대폰 구매 포인트", cost: 4500, tag: "HOT" },
  { id: "r2", label: "레저 · 여행 30% 할인권", cost: 3000, tag: "베스트" },
  { id: "r3", label: "전기차 충전 포인트", cost: 8000, tag: "한정" },
  { id: "r4", label: "USDT 5달러 전환", cost: 6500 },
];

const ONE_DAY = 24 * 60 * 60 * 1000;
const DAILY_CHECKIN = 30;

interface PointsState {
  balance: number;
  history: PointTx[];
  lastCheckinAt: number | null;

  earn: (label: string, amount: number, type?: PointTxType) => void;
  spend: (label: string, amount: number, type?: PointTxType) => boolean;
  redeem: (rewardId: string) => { ok: boolean; reason?: string };
  dailyCheckin: () => { ok: boolean; reason?: string; amount?: number };
  canCheckin: () => boolean;
  reset: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      balance: 12480,
      history: [
        { id: "seed-1", label: "친구 초대 보상", amount: 1000, type: "earn", createdAt: Date.now() - 9 * ONE_DAY },
        { id: "seed-2", label: "프리미엄 미션 완료", amount: 500, type: "earn", createdAt: Date.now() - 6 * ONE_DAY },
        { id: "seed-3", label: "포인트 → ETH 전환", amount: -2400, type: "convert", createdAt: Date.now() - 3 * ONE_DAY },
        { id: "seed-4", label: "송금 캐시백 (USDT)", amount: 120, type: "earn", createdAt: Date.now() - ONE_DAY },
      ],
      lastCheckinAt: null,

      earn: (label, amount, type = "earn") => {
        if (amount <= 0) return;
        set((s) => ({
          balance: s.balance + amount,
          history: [
            { id: uid(), label, amount, type, createdAt: Date.now() },
            ...s.history,
          ].slice(0, 100),
        }));
      },

      spend: (label, amount, type = "spend") => {
        if (amount <= 0) return false;
        if (get().balance < amount) return false;
        set((s) => ({
          balance: s.balance - amount,
          history: [
            { id: uid(), label, amount: -amount, type, createdAt: Date.now() },
            ...s.history,
          ].slice(0, 100),
        }));
        return true;
      },

      redeem: (rewardId) => {
        const r = REWARDS.find((x) => x.id === rewardId);
        if (!r) return { ok: false, reason: "상품을 찾을 수 없습니다." };
        if (get().balance < r.cost) return { ok: false, reason: "포인트가 부족합니다." };
        get().spend(`${r.label} 교환`, r.cost, "redeem");
        return { ok: true };
      },

      canCheckin: () => {
        const last = get().lastCheckinAt;
        if (!last) return true;
        return Date.now() - last >= ONE_DAY;
      },

      dailyCheckin: () => {
        if (!get().canCheckin()) {
          return { ok: false, reason: "오늘은 이미 출석했어요." };
        }
        get().earn("일일 출석 보너스", DAILY_CHECKIN, "checkin");
        set({ lastCheckinAt: Date.now() });
        return { ok: true, amount: DAILY_CHECKIN };
      },

      reset: () =>
        set({ balance: 0, history: [], lastCheckinAt: null }),
    }),
    {
      name: "sv-points-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "방금";
  if (diff < ONE_DAY) return "오늘";
  if (diff < 2 * ONE_DAY) return "어제";
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
