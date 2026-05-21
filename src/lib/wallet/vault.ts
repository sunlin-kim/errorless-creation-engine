/**
 * 암호화된 시드 vault — IndexedDB 저장소.
 *
 * 저장되는 것: 암호화된 니모닉 (AES-GCM), 생성일, 라벨
 * 저장되지 않는 것: 평문 시드, 평문 비밀번호, 평문 개인키
 *
 * 평문 시드는 메모리에만 (zustand) 두고, 잠금 시 즉시 폐기.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { EncryptedPayload } from "./crypto";

const DB_NAME = "supervizion-wallet";
const DB_VERSION = 1;
const STORE = "vault";
const VAULT_KEY = "primary";

export interface StoredVault {
  encryptedMnemonic: EncryptedPayload;
  createdAt: number;
  /** 사용자가 백업 완료를 확인했는지 */
  backupConfirmed: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("INDEXEDDB_UNAVAILABLE");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveVault(vault: StoredVault): Promise<void> {
  const db = await getDB();
  await db.put(STORE, vault, VAULT_KEY);
}

export async function loadVault(): Promise<StoredVault | null> {
  const db = await getDB();
  const v = (await db.get(STORE, VAULT_KEY)) as StoredVault | undefined;
  return v ?? null;
}

export async function hasVault(): Promise<boolean> {
  const v = await loadVault();
  return v !== null;
}

export async function deleteVault(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, VAULT_KEY);
}

export async function markBackupConfirmed(): Promise<void> {
  const v = await loadVault();
  if (!v) return;
  v.backupConfirmed = true;
  await saveVault(v);
}
