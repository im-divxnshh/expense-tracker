import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { Expense, Person, Settings, Transaction } from "@/types";
import type { Repo } from "./types";

/**
 * Firestore-backed repository. Used when NEXT_PUBLIC_FIREBASE_* is configured.
 * Soft-deleted docs are filtered client-side (single-user dataset is small).
 */
export class FirestoreRepo implements Repo {
  readonly backend = "firestore" as const;
  constructor(private db: Firestore) {}

  private async all<T>(name: string): Promise<T[]> {
    const snap = await getDocs(collection(this.db, name));
    return snap.docs.map((d) => d.data() as T);
  }

  private notDeleted<T extends { deletedAt?: number | null }>(items: T[]): T[] {
    return items.filter((i) => !i.deletedAt);
  }

  private async create<T extends { id: string }>(name: string, data: T): Promise<T> {
    await setDoc(doc(this.db, name, data.id), data as Record<string, unknown>);
    return data;
  }

  private async patch<T extends object>(
    name: string,
    id: string,
    patch: Partial<T>,
  ): Promise<void> {
    await updateDoc(doc(this.db, name, id), {
      ...patch,
      updatedAt: Date.now(),
    } as Record<string, unknown>);
  }

  listPeople() {
    return this.all<Person>("people").then((p) => this.notDeleted(p));
  }
  createPerson(data: Person) {
    return this.create("people", data);
  }
  updatePerson(id: string, patch: Partial<Person>) {
    return this.patch<Person>("people", id, patch);
  }
  softDeletePerson(id: string) {
    return this.patch<Person>("people", id, { deletedAt: Date.now() });
  }

  listTransactions() {
    return this.all<Transaction>("transactions").then((t) => this.notDeleted(t));
  }
  createTransaction(data: Transaction) {
    return this.create("transactions", data);
  }
  updateTransaction(id: string, patch: Partial<Transaction>) {
    return this.patch<Transaction>("transactions", id, patch);
  }
  softDeleteTransaction(id: string) {
    return this.patch<Transaction>("transactions", id, { deletedAt: Date.now() });
  }

  listExpenses() {
    return this.all<Expense>("expenses").then((e) => this.notDeleted(e));
  }
  createExpense(data: Expense) {
    return this.create("expenses", data);
  }
  updateExpense(id: string, patch: Partial<Expense>) {
    return this.patch<Expense>("expenses", id, patch);
  }
  softDeleteExpense(id: string) {
    return this.patch<Expense>("expenses", id, { deletedAt: Date.now() });
  }

  async getSettings() {
    const snap = await getDoc(doc(this.db, "settings", "settings"));
    return snap.exists() ? (snap.data() as Settings) : null;
  }
  async saveSettings(settings: Settings) {
    await setDoc(doc(this.db, "settings", "settings"), settings);
  }
}
