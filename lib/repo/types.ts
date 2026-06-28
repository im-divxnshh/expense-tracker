import type { Expense, Person, Settings, Transaction } from "@/types";

/**
 * A backend-agnostic data repository. Both the Firestore and the local
 * (IndexedDB) implementations satisfy this interface, so the rest of the app
 * never needs to know which backend is active.
 */
export interface Repo {
  readonly backend: "firestore" | "local";

  // People
  listPeople(): Promise<Person[]>;
  createPerson(data: Person): Promise<Person>;
  updatePerson(id: string, patch: Partial<Person>): Promise<void>;
  softDeletePerson(id: string): Promise<void>;

  // Transactions
  listTransactions(): Promise<Transaction[]>;
  createTransaction(data: Transaction): Promise<Transaction>;
  updateTransaction(id: string, patch: Partial<Transaction>): Promise<void>;
  softDeleteTransaction(id: string): Promise<void>;

  // Expenses
  listExpenses(): Promise<Expense[]>;
  createExpense(data: Expense): Promise<Expense>;
  updateExpense(id: string, patch: Partial<Expense>): Promise<void>;
  softDeleteExpense(id: string): Promise<void>;

  // Settings (single document)
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<void>;
}
