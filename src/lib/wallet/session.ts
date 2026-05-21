import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "supervizion-wallet-session";
const DB_VERSION = 1;
const STORE = "device-session";
const SESSION_KEY = "primary";

interface SessionRecord {
  key: CryptoKey;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
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

function getCrypto() {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WEBCRYPTO_UNAVAILABLE");
  }
  return crypto;
}

export async function saveUnlockedMnemonic(mnemonic: string): Promise<void> {
  const db = await getDB();
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(mnemonic),
  );

  await db.put(
    STORE,
    {
      key,
      iv: iv.buffer.slice(0),
      ciphertext,
    } satisfies SessionRecord,
    SESSION_KEY,
  );
}

export async function loadUnlockedMnemonic(): Promise<string | null> {
  const db = await getDB();
  const cryptoApi = getCrypto();
  const record = (await db.get(STORE, SESSION_KEY)) as SessionRecord | undefined;
  if (!record) return null;

  try {
    const plain = await cryptoApi.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(record.iv) },
      record.key,
      record.ciphertext,
    );
    return new TextDecoder().decode(plain);
  } catch {
    await clearUnlockedMnemonic();
    return null;
  }
}

export async function clearUnlockedMnemonic(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, SESSION_KEY);
}