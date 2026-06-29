"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import type {
  Expense,
  Person,
  PersonWithBalance,
  Settings,
  Transaction,
} from "@/types";
import { getRepo } from "@/lib/repo";
import { generateId } from "@/lib/utils";
import { personBalances } from "@/lib/selectors";
import { DEFAULT_CURRENCY, OWNER_NAME } from "@/constants";

type NewPerson = Omit<Person, keyof BaseFields>;
type NewTransaction = Omit<Transaction, keyof BaseFields>;
type NewExpense = Omit<Expense, keyof BaseFields>;
interface BaseFields {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  ownerName: OWNER_NAME,
  currency: DEFAULT_CURRENCY,
  updatedAt: Date.now(),
};

interface LedgerContextValue {
  loading: boolean;
  backend: "firestore" | "local";
  people: Person[];
  peopleWithBalance: PersonWithBalance[];
  transactions: Transaction[];
  expenses: Expense[];
  settings: Settings;

  getPerson: (id: string) => PersonWithBalance | undefined;
  addPerson: (input: NewPerson) => Promise<Person>;
  updatePerson: (id: string, patch: Partial<NewPerson>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;

  addTransaction: (input: NewTransaction) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<NewTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addExpense: (input: NewExpense) => Promise<Expense>;
  updateExpense: (id: string, patch: Partial<NewExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  importData: (data: ImportPayload) => Promise<ImportSummary>;
  clearAllData: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ImportPayload {
  people?: Person[];
  transactions?: Transaction[];
  expenses?: Expense[];
  settings?: Partial<Settings>;
}

export interface ImportSummary {
  people: number;
  transactions: number;
  expenses: number;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function stamp<T extends object>(data: T): T & BaseFields {
  const now = Date.now();
  return { ...data, id: generateId(), createdAt: now, updatedAt: now, deletedAt: null };
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => getRepo(), []);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    const [p, t, e, s] = await Promise.all([
      repo.listPeople(),
      repo.listTransactions(),
      repo.listExpenses(),
      repo.getSettings(),
    ]);
    setPeople(p);
    setTransactions(t);
    setExpenses(e);
    setSettings(s ?? DEFAULT_SETTINGS);
  }, [repo]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        console.error(err);
        if (active) toast.error("Failed to load data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  // ---- People ----
  const addPerson = useCallback(
    async (input: NewPerson) => {
      const person = stamp(input) as Person;
      setPeople((prev) => [...prev, person]);
      try {
        await repo.createPerson(person);
        toast.success("Person added");
      } catch (err) {
        console.error(err);
        setPeople((prev) => prev.filter((p) => p.id !== person.id));
        toast.error("Could not add person");
        throw err;
      }
      return person;
    },
    [repo],
  );

  const updatePerson = useCallback(
    async (id: string, patch: Partial<NewPerson>) => {
      const prev = people;
      setPeople((cur) =>
        cur.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
      );
      try {
        await repo.updatePerson(id, patch);
        toast.success("Person updated");
      } catch (err) {
        console.error(err);
        setPeople(prev);
        toast.error("Could not update person");
        throw err;
      }
    },
    [repo, people],
  );

  const deletePerson = useCallback(
    async (id: string) => {
      const prev = people;
      setPeople((cur) => cur.filter((p) => p.id !== id));
      try {
        await repo.softDeletePerson(id);
        toast.success("Person deleted");
      } catch (err) {
        console.error(err);
        setPeople(prev);
        toast.error("Could not delete person");
        throw err;
      }
    },
    [repo, people],
  );

  // ---- Transactions ----
  const addTransaction = useCallback(
    async (input: NewTransaction) => {
      const txn = stamp(input) as Transaction;
      setTransactions((prev) => [...prev, txn]);
      try {
        await repo.createTransaction(txn);
        toast.success(input.type === "given" ? "Money given recorded" : "Money received recorded");
      } catch (err) {
        console.error(err);
        setTransactions((prev) => prev.filter((t) => t.id !== txn.id));
        toast.error("Could not save transaction");
        throw err;
      }
      return txn;
    },
    [repo],
  );

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<NewTransaction>) => {
      const prev = transactions;
      setTransactions((cur) =>
        cur.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
      );
      try {
        await repo.updateTransaction(id, patch);
        toast.success("Transaction updated");
      } catch (err) {
        console.error(err);
        setTransactions(prev);
        toast.error("Could not update transaction");
        throw err;
      }
    },
    [repo, transactions],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const prev = transactions;
      setTransactions((cur) => cur.filter((t) => t.id !== id));
      try {
        await repo.softDeleteTransaction(id);
        toast.success("Transaction deleted");
      } catch (err) {
        console.error(err);
        setTransactions(prev);
        toast.error("Could not delete transaction");
        throw err;
      }
    },
    [repo, transactions],
  );

  // ---- Expenses ----
  const addExpense = useCallback(
    async (input: NewExpense) => {
      const expense = stamp(input) as Expense;
      setExpenses((prev) => [...prev, expense]);
      try {
        await repo.createExpense(expense);
        toast.success("Expense added");
      } catch (err) {
        console.error(err);
        setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
        toast.error("Could not add expense");
        throw err;
      }
      return expense;
    },
    [repo],
  );

  const updateExpense = useCallback(
    async (id: string, patch: Partial<NewExpense>) => {
      const prev = expenses;
      setExpenses((cur) =>
        cur.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)),
      );
      try {
        await repo.updateExpense(id, patch);
        toast.success("Expense updated");
      } catch (err) {
        console.error(err);
        setExpenses(prev);
        toast.error("Could not update expense");
        throw err;
      }
    },
    [repo, expenses],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const prev = expenses;
      setExpenses((cur) => cur.filter((e) => e.id !== id));
      try {
        await repo.softDeleteExpense(id);
        toast.success("Expense deleted");
      } catch (err) {
        console.error(err);
        setExpenses(prev);
        toast.error("Could not delete expense");
        throw err;
      }
    },
    [repo, expenses],
  );

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch, id: "settings" as const, updatedAt: Date.now() };
      setSettings(next);
      try {
        await repo.saveSettings(next);
        toast.success("Settings saved");
      } catch (err) {
        console.error(err);
        setSettings(settings);
        toast.error("Could not save settings");
        throw err;
      }
    },
    [repo, settings],
  );

  // ---- Bulk operations (restore / wipe) ----
  const importData = useCallback(
    async (data: ImportPayload): Promise<ImportSummary> => {
      // Re-stamp every record so ids/timestamps are fresh and never collide.
      const newPeople = (data.people ?? []).map((p) => stamp(p) as Person);
      const newTxns = (data.transactions ?? []).map((t) => stamp(t) as Transaction);
      const newExpenses = (data.expenses ?? []).map((e) => stamp(e) as Expense);
      try {
        await Promise.all([
          ...newPeople.map((p) => repo.createPerson(p)),
          ...newTxns.map((t) => repo.createTransaction(t)),
          ...newExpenses.map((e) => repo.createExpense(e)),
        ]);
        if (data.settings) {
          const next = { ...settings, ...data.settings, id: "settings" as const, updatedAt: Date.now() };
          await repo.saveSettings(next);
        }
        await refresh();
        toast.success(
          `Imported ${newPeople.length} people, ${newTxns.length} transactions, ${newExpenses.length} expenses`,
        );
      } catch (err) {
        console.error(err);
        toast.error("Could not import data");
        throw err;
      }
      return {
        people: newPeople.length,
        transactions: newTxns.length,
        expenses: newExpenses.length,
      };
    },
    [repo, settings, refresh],
  );

  const clearAllData = useCallback(async () => {
    try {
      await Promise.all([
        ...people.map((p) => repo.softDeletePerson(p.id)),
        ...transactions.map((t) => repo.softDeleteTransaction(t.id)),
        ...expenses.map((e) => repo.softDeleteExpense(e.id)),
      ]);
      setPeople([]);
      setTransactions([]);
      setExpenses([]);
      toast.success("All data cleared");
    } catch (err) {
      console.error(err);
      await refresh();
      toast.error("Could not clear data");
      throw err;
    }
  }, [repo, people, transactions, expenses, refresh]);

  const peopleWithBalance = useMemo(
    () => personBalances(people, transactions),
    [people, transactions],
  );

  const getPerson = useCallback(
    (id: string) => peopleWithBalance.find((p) => p.id === id),
    [peopleWithBalance],
  );

  const value: LedgerContextValue = {
    loading,
    backend: repo.backend,
    people,
    peopleWithBalance,
    transactions,
    expenses,
    settings,
    getPerson,
    addPerson,
    updatePerson,
    deletePerson,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addExpense,
    updateExpense,
    deleteExpense,
    saveSettings,
    importData,
    clearAllData,
    refresh,
  };

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}

/** Convenience hook for currency formatting bound to current settings. */
export function useCurrency() {
  const { settings } = useLedger();
  return settings.currency;
}
