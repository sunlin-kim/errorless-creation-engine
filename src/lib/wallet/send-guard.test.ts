import { describe, it, expect } from "vitest";
import { validateSendPrecondition } from "./send-guard";

const base = {
  fromAddress: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  amount: "1",
  decimals: 18,
};

describe("validateSendPrecondition", () => {
  it("accepts a valid input", () => {
    const r = validateSendPrecondition(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed).toBe(10n ** 18n);
  });

  it("blocks when fromAddress is missing (지갑 파생 전 차단)", () => {
    for (const v of [null, undefined, "", "   "]) {
      const r = validateSendPrecondition({ ...base, fromAddress: v as string | null });
      expect(r).toEqual({ ok: false, error: "NO_FROM" });
    }
  });

  it("blocks when recipient is missing", () => {
    const r = validateSendPrecondition({ ...base, to: "" });
    expect(r).toEqual({ ok: false, error: "NO_TO" });
  });

  it("blocks zero amount (0원 송금 차단)", () => {
    expect(validateSendPrecondition({ ...base, amount: "0" })).toEqual({
      ok: false,
      error: "ZERO_AMOUNT",
    });
    expect(validateSendPrecondition({ ...base, amount: "0.000000000000000000" })).toEqual({
      ok: false,
      error: "ZERO_AMOUNT",
    });
  });

  it("blocks negative amount", () => {
    expect(validateSendPrecondition({ ...base, amount: "-1" })).toEqual({
      ok: false,
      error: "NEGATIVE_AMOUNT",
    });
  });

  it("blocks malformed amount", () => {
    for (const v of ["", "abc", "1.2.3", "1e3", "  "]) {
      const r = validateSendPrecondition({ ...base, amount: v });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(["BAD_AMOUNT", "ZERO_AMOUNT"]).toContain(r.error);
    }
  });

  it("blocks fractional digits exceeding decimals", () => {
    const r = validateSendPrecondition({ ...base, amount: "0.0000001", decimals: 6 });
    expect(r).toEqual({ ok: false, error: "BAD_AMOUNT" });
  });
});
