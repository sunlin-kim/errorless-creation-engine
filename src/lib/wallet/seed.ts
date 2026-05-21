/**
 * BIP39 니모닉 시드 생성·검증.
 *
 * - 12단어 (128bit 엔트로피) — 업계 표준
 * - 영어 워드리스트만 지원 (Phase 1)
 * - 검증은 BIP39 체크섬 포함
 */

import { generateMnemonic, validateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export const MNEMONIC_WORD_COUNT = 12;

export function createMnemonic(): string {
  // 128 bits → 12 words
  return generateMnemonic(wordlist, 128);
}

export function isValidMnemonic(phrase: string): boolean {
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(" ");
  return validateMnemonic(normalized, wordlist);
}

export function normalizeMnemonic(phrase: string): string {
  return phrase.trim().toLowerCase().split(/\s+/).join(" ");
}

export async function mnemonicToSeedBytes(phrase: string): Promise<Uint8Array> {
  return mnemonicToSeed(normalizeMnemonic(phrase));
}

/** 단어 자동완성 후보 검색용 */
export function searchWordlist(prefix: string, limit = 8): string[] {
  if (!prefix) return [];
  const p = prefix.toLowerCase();
  const out: string[] = [];
  for (const w of wordlist) {
    if (w.startsWith(p)) {
      out.push(w);
      if (out.length >= limit) break;
    }
  }
  return out;
}
