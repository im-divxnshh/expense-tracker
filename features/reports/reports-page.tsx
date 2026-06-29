"use client";

import * as React from "react";
import { startOfMonth, startOfYear, subMonths, differenceInCalendarMonths } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/money";
import { CategoryBadge } from "@/components/badges";
import { StatCard } from "@/features/dashboard/stat-card";
import {
  CashFlowChart,
  CategoryPieChart,
  IncomeVsExpenseChart,
  MonthlyExpensesChart,
} from "@/features/dashboard/charts";
import {
  computeTotals,
  expensesByCategory,
  monthlySeries,
} from "@/lib/selectors";
import { downloadCSV } from "@/lib/export";
import { formatDate, toDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABEL } from "@/constants";
import type { Expense, Transaction } from "@/types";

type PeriodKey = "3m" | "6m" | "12m" | "ytd" | "all";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "12m", label: "Last 12 months" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
];

/** Resolve a period to a start boundary (null = no lower bound) + month count for charts. */
function resolvePeriod(
  key: PeriodKey,
  earliest: Date | null,
): { start: Date | null; months: number } {
  const now = new Date();
  switch (key) {
    case "3m":
      return { start: startOfMonth(subMonths(now, 2)), months: 3 };
    case "6m":
      return { start: startOfMonth(subMonths(now, 5)), months: 6 };
    case "12m":
      return { start: startOfMonth(subMonths(now, 11)), months: 12 };
    case "ytd":
      return { start: startOfYear(now), months: now.getMonth() + 1 };
    case "all": {
      const span = earliest ? differenceInCalendarMonths(now, earliest) + 1 : 6;
      return { start: null, months: Math.min(Math.max(span, 6), 36) };
    }
  }
}

export function ReportsPage() {
  const { transactions, expenses, peopleWithBalance, people, loading } = useLedger();
  const [period, setPeriod] = React.useState<PeriodKey>("6m");

  const earliest = React.useMemo(() => {
    let min: Date | null = null;
    for (const r of [...transactions, ...expenses]) {
      const d = toDate(r.date);
      if (d && (!min || d < min)) min = d;
    }
    return min;
  }, [transactions, expenses]);

  const { start, months } = resolvePeriod(period, earliest);

  const inRange = React.useCallback(
    (date: string) => {
      if (!start) return true;
      const d = toDate(date);
      return d ? d >= start : false;
    },
    [start],
  );

  const filteredTxns = React.useMemo(
    () => transactions.filter((t) => inRange(t.date)),
    [transactions, inRange],
  );
  const filteredExpenses = React.useMemo(
    () => expenses.filter((e) => inRange(e.date)),
    [expenses, inRange],
  );

  const totals = React.useMemo(
    () => computeTotals(filteredTxns, filteredExpenses),
    [filteredTxns, filteredExpenses],
  );
  const monthly = React.useMemo(
    () => monthlySeries(transactions, expenses, months),
    [transactions, expenses, months],
  );
  const categories = React.useMemo(
    () => expensesByCategory(filteredExpenses),
    [filteredExpenses],
  );
  const categoryTotal = categories.reduce((s, c) => s + c.value, 0);

  const outstanding = React.useMemo(
    () =>
      peopleWithBalance
        .filter((p) => p.pending > 0)
        .sort((a, b) => b.pending - a.pending)
        .slice(0, 8),
    [peopleWithBalance],
  );

  const nameOf = React.useMemo(
    () => new Map(people.map((p) => [p.id, p.fullName])),
    [people],
  );

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";

  function exportTransactions() {
    downloadCSV<Transaction>(`transactions-${period}.csv`, filteredTxns, [
      { header: "Date", value: (t) => t.date },
      { header: "Person", value: (t) => nameOf.get(t.personId) ?? "Unknown" },
      { header: "Type", value: (t) => t.type },
      { header: "Amount", value: (t) => t.amount },
      { header: "Method", value: (t) => PAYMENT_METHOD_LABEL[t.method] },
      { header: "Notes", value: (t) => t.notes ?? "" },
    ]);
  }

  function exportExpenses() {
    downloadCSV<Expense>(`expenses-${period}.csv`, filteredExpenses, [
      { header: "Date", value: (e) => e.date },
      { header: "Title", value: (e) => e.title },
      { header: "Category", value: (e) => e.category },
      { header: "Amount", value: (e) => e.amount },
      { header: "Method", value: (e) => PAYMENT_METHOD_LABEL[e.method] },
      { header: "Notes", value: (e) => e.notes ?? "" },
    ]);
  }

  const hasData = filteredTxns.length > 0 || filteredExpenses.length > 0;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analytics across your money given, received and spent."
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </Card>
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={TrendingUp}
          title="No activity in this period"
          description="Try a wider time range, or add transactions and expenses to see reports."
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{periodLabel}</span> ·{" "}
            {filteredTxns.length} transactions · {filteredExpenses.length} expenses
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Money Received" value={totals.totalReceived} icon={ArrowDownLeft} accent="success" index={0} />
            <StatCard label="Money Given" value={totals.totalGiven} icon={ArrowUpRight} accent="danger" index={1} />
            <StatCard label="Expenses" value={totals.totalExpenses} icon={Receipt} accent="warning" index={2} />
            <StatCard label="Net Cash Flow" value={totals.cashFlow} icon={TrendingUp} accent="neutral" colored index={3} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <IncomeVsExpenseChart data={monthly} />
            <CashFlowChart data={monthly} />
            <MonthlyExpensesChart data={monthly} />
            <CategoryPieChart data={categories} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by category</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No expenses in this period.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {categories.map((c) => {
                      const pct = categoryTotal ? (c.value / categoryTotal) * 100 : 0;
                      return (
                        <li key={c.category} className="flex items-center gap-3">
                          <div className="w-32 shrink-0">
                            <CategoryBadge category={c.category} />
                          </div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                          <span className="w-24 shrink-0 text-right text-sm font-medium">
                            <Money amount={c.value} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding balances</CardTitle>
              </CardHeader>
              <CardContent>
                {outstanding.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No pending balances 🎉
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {outstanding.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            Last activity{" "}
                            {p.lastTransactionDate
                              ? formatDate(p.lastTransactionDate)
                              : "—"}
                          </p>
                        </div>
                        <Money amount={p.pending} className="font-semibold text-primary" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="no-print">
            <CardHeader>
              <CardTitle>Export data</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportTransactions}>
                <Download className="size-4" /> Transactions CSV
              </Button>
              <Button variant="outline" onClick={exportExpenses}>
                <Download className="size-4" /> Expenses CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" /> Print / Save as PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
