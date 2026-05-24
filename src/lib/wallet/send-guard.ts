/**
 * 송금 전 사전 검증 (UI 와 분리된 순수 함수, 테스트 가능).
 *
 * 차단 조건:
 *  - fromAddress 비어있음 (지갑 파생 전)
 *  - 수신 주소 비어있음
 *  - 금액 파싱 실패 / 0 이하 / 음수 / 비정상 입력
 */

import { parseUnits } from "./send";

export interface PreSendInput {
  fromAddress: string | null | undefined;
  to: string | null | undefined;
  amount: string | null | undefined;
  decimals: number;
}

export type PreSendError =
  | "NO_FROM"
  | "NO_TO"
  | "BAD_AMOUNT"
  | "ZERO_AMOUNT"
  | "NEGATIVE_AMOUNT";

export interface PreSendOk {
  ok: true;
  parsed: bigint;
}
export interface PreSendFail {
  ok: false;
  error: PreSendError;
}

export function validateSendPrecondition(input: PreSendInput): PreSendOk | PreSendFail {
  if (!input.fromAddress || input.fromAddress.trim() === "") {
    return { ok: false, error: "NO_FROM" };
  }
  if (!input.to || input.to.trim() === "") {
    return { ok: false, error: "NO_TO" };
  }
  const raw = (input.amount ?? "").trim();
  if (raw.startsWith("-")) return { ok: false, error: "NEGATIVE_AMOUNT" };
  let parsed: bigint;
  try {
    parsed = parseUnits(raw, input.decimals);
  } catch {
    return { ok: false, error: "BAD_AMOUNT" };
  }
  if (parsed <= 0n) return { ok: false, error: "ZERO_AMOUNT" };
  return { ok: true, parsed };
}
