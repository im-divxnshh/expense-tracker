import {
  differenceInCalendarDays,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import type {
  Expense,
  ExpenseCategory,
  Person,
  PersonWithBalance,
  ReminderBucket,
  ReminderItem,
  Transaction,
} from "@/types";
import { toDate } from "@/lib/utils";

export function personBalances(
  people: Person[],
  transactions: Transaction[],
): PersonWithBalance[] {
  const byPerson = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const arr = byPerson.get(t.personId) ?? [];
    arr.push(t);
    byPerson.set(t.personId, arr);
  }

  return people.map((person) => {
    const txns = byPerson.get(person.id) ?? [];
    let totalGiven = 0;
    let totalReceived = 0;
    let lastTransactionDate: string | null = null;
    for (const t of txns) {
      if (t.type === "given") totalGiven += t.amount;
      else totalReceived += t.amount;
      if (!lastTransactionDate || t.date > lastTransactionDate) {
        lastTransactionDate = t.date;
      }
    }
    return {
      ...person,
      totalGiven,
      totalReceived,
      pending: totalGiven - totalReceived,
      lastTransactionDate,
      transactionCount: txns.length,
    };
  });
}

export interface Totals {
  totalGiven: number;
  totalReceived: number;
  pending: number;
  totalExpenses: number;
  cashFlow: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthCollection: number;
  thisMonthGiven: number;
}

export function computeTotals(
  transactions: Transaction[],
  expenses: Expense[],
): Totals {
  const now = new Date();
  let totalGiven = 0;
  let totalReceived = 0;
  let thisMonthCollection = 0;
  let thisMonthGiven = 0;

  for (const t of transactions) {
    const d = toDate(t.date);
    const inMonth = d ? isSameMonth(d, now) : false;
    if (t.type === "given") {
      totalGiven += t.amount;
      if (inMonth) thisMonthGiven += t.amount;
    } else {
      totalReceived += t.amount;
      if (inMonth) thisMonthCollection += t.amount;
    }
  }

  let totalExpenses = 0;
  let thisMonthExpense = 0;
  for (const e of expenses) {
    totalExpenses += e.amount;
    const d = toDate(e.date);
    if (d && isSameMonth(d, now)) thisMonthExpense += e.amount;
  }

  return {
    totalGiven,
    totalReceived,
    pending: totalGiven - totalReceived,
    totalExpenses,
    // Cash flow = money received back minus money handed out and spent.
    cashFlow: totalReceived - totalGiven - totalExpenses,
    thisMonthIncome: thisMonthCollection,
    thisMonthExpense,
    thisMonthCollection,
    thisMonthGiven,
  };
}

export interface MonthlyPoint {
  month: string; // "Jan 25"
  key: string; // "2025-01"
  given: number;
  received: number;
  expense: number;
  net: number;
}

/** Build a series for the last `count` months (oldest → newest). */
export function monthlySeries(
  transactions: Transaction[],
  expenses: Expense[],
  count = 6,
): MonthlyPoint[] {
  const now = startOfMonth(new Date());
  const points: MonthlyPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = subMonths(now, i);
    points.push({
      month: format(m, "MMM yy"),
      key: format(m, "yyyy-MM"),
      given: 0,
      received: 0,
      expense: 0,
      net: 0,
    });
  }
  const index = new Map(points.map((p) => [p.key, p]));

  for (const t of transactions) {
    const d = toDate(t.date);
    if (!d) continue;
    const p = index.get(format(d, "yyyy-MM"));
    if (!p) continue;
    if (t.type === "given") p.given += t.amount;
    else p.received += t.amount;
  }
  for (const e of expenses) {
    const d = toDate(e.date);
    if (!d) continue;
    const p = index.get(format(d, "yyyy-MM"));
    if (!p) continue;
    p.expense += e.amount;
  }
  for (const p of points) p.net = p.received - p.expense;
  return points;
}

export interface CategorySlice {
  category: ExpenseCategory;
  value: number;
}

export function expensesByCategory(expenses: Expense[]): CategorySlice[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

function bucketFor(days: number): ReminderBucket {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return "upcoming";
}

/** People with a due date and an outstanding pending balance, grouped by urgency. */
export function reminderItems(people: PersonWithBalance[]): ReminderItem[] {
  const today = new Date();
  const items: ReminderItem[] = [];
  for (const person of people) {
    const due = person.dueDate ?? person.reminderDate;
    if (!due) continue;
    if (person.pending <= 0) continue;
    const d = toDate(due);
    if (!d) continue;
    const daysDiff = differenceInCalendarDays(d, today);
    items.push({
      person,
      dueDate: due,
      bucket: bucketFor(daysDiff),
      daysDiff,
    });
  }
  return items.sort((a, b) => a.daysDiff - b.daysDiff);
}

export function sortByDateDesc<T extends { date: string; createdAt: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}
