/**
 * 클라이언트 사이드 암호화 유틸리티.
 *
 * - PBKDF2-SHA256 (210,000 iter, OWASP 2023 권장) 으로 비밀번호 → 키 파생
 * - AES-GCM 256bit 로 시드 암호화
 * - salt, iv 는 매번 새로 생성하여 함께 저장
 *
 * 서버는 이 데이터를 절대 보지 못합니다 — 모든 연산은 브라우저에서만.
 */

const PBKDF2_ITERATIONS = 210_000;
const KEY_LENGTH_BITS = 256;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;

export interface EncryptedPayload {
  /** base64 (salt | iv | ciphertext) */
  data: string;
  iterations: number;
  algo: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  version: 1;
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(
  plaintext: string,
  password: string,
): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertext, salt.length + iv.length);
  return {
    data: toBase64(combined),
    iterations: PBKDF2_ITERATIONS,
    algo: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    version: 1,
  };
}

export async function decryptString(
  payload: EncryptedPayload,
  password: string,
): Promise<string> {
  const combined = fromBase64(payload.data);
  const salt = combined.slice(0, SALT_LENGTH_BYTES);
  const iv = combined.slice(SALT_LENGTH_BYTES, SALT_LENGTH_BYTES + IV_LENGTH_BYTES);
  const ciphertext = combined.slice(SALT_LENGTH_BYTES + IV_LENGTH_BYTES);
  const key = await deriveKey(password, salt, payload.iterations);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("WRONG_PASSWORD");
  }
}
