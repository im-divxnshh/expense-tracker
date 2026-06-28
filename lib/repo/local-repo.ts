import type { Expense, Person, Settings, Transaction } from "@/types";
import type { Repo } from "./types";

/**
 * IndexedDB-backed repository used when Firebase is not configured.
 * Stores each collection in its own object store keyed by `id`.
 * Falls back to in-memory if IndexedDB is unavailable (e.g. SSR).
 */

const DB_NAME = "ledgerly";
const DB_VERSION = 1;
const STORES = ["people", "transactions", "expenses", "settings"] as const;
type StoreName = (typeof STORES)[number];

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = fn(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      }),
  );
}

// In-memory fallback (SSR / private mode without IndexedDB).
const memory: Record<StoreName, Map<string, unknown>> = {
  people: new Map(),
  transactions: new Map(),
  expenses: new Map(),
  settings: new Map(),
};

async function getAll<T>(store: StoreName): Promise<T[]> {
  if (!hasIndexedDB()) return Array.from(memory[store].values()) as T[];
  return tx<T[]>(store, "readonly", (s) => s.getAll());
}

async function getOne<T>(store: StoreName, id: string): Promise<T | null> {
  if (!hasIndexedDB()) return (memory[store].get(id) as T) ?? null;
  const result = await tx<T | undefined>(store, "readonly", (s) => s.get(id));
  return result ?? null;
}

async function put<T extends { id: string }>(store: StoreName, value: T): Promise<void> {
  if (!hasIndexedDB()) {
    memory[store].set(value.id, value);
    return;
  }
  await tx(store, "readwrite", (s) => s.put(value));
}

function notDeleted<T extends { deletedAt?: number | null }>(items: T[]): T[] {
  return items.filter((i) => !i.deletedAt);
}

async function patchDoc<T extends { id: string; updatedAt: number }>(
  store: StoreName,
  id: string,
  patch: Partial<T>,
): Promise<void> {
  const existing = await getOne<T>(store, id);
  if (!existing) return;
  await put(store, { ...existing, ...patch, id, updatedAt: Date.now() });
}

export class LocalRepo implements Repo {
  readonly backend = "local" as const;

  listPeople() {
    return getAll<Person>("people").then(notDeleted);
  }
  async createPerson(data: Person) {
    await put("people", data);
    return data;
  }
  updatePerson(id: string, patch: Partial<Person>) {
    return patchDoc<Person>("people", id, patch);
  }
  softDeletePerson(id: string) {
    return patchDoc<Person>("people", id, { deletedAt: Date.now() });
  }

  listTransactions() {
    return getAll<Transaction>("transactions").then(notDeleted);
  }
  async createTransaction(data: Transaction) {
    await put("transactions", data);
    return data;
  }
  updateTransaction(id: string, patch: Partial<Transaction>) {
    return patchDoc<Transaction>("transactions", id, patch);
  }
  softDeleteTransaction(id: string) {
    return patchDoc<Transaction>("transactions", id, { deletedAt: Date.now() });
  }

  listExpenses() {
    return getAll<Expense>("expenses").then(notDeleted);
  }
  async createExpense(data: Expense) {
    await put("expenses", data);
    return data;
  }
  updateExpense(id: string, patch: Partial<Expense>) {
    return patchDoc<Expense>("expenses", id, patch);
  }
  softDeleteExpense(id: string) {
    return patchDoc<Expense>("expenses", id, { deletedAt: Date.now() });
  }

  getSettings() {
    return getOne<Settings>("settings", "settings");
  }
  async saveSettings(settings: Settings) {
    await put("settings", settings);
  }
}
