"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  Receipt,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatCard } from "./stat-card";
import {
  CashFlowChart,
  CategoryPieChart,
  IncomeVsExpenseChart,
  MonthlyCollectionsChart,
  MonthlyExpensesChart,
} from "./charts";
import { DashboardWidgets } from "./widgets";
import {
  computeTotals,
  expensesByCategory,
  monthlySeries,
} from "@/lib/selectors";
import { OWNER_NAME } from "@/constants";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { ExpenseFormDialog } from "@/features/expenses/expense-form-dialog";

export function Dashboard() {
  const { transactions, expenses, peopleWithBalance, loading, settings } = useLedger();

  const totals = React.useMemo(
    () => computeTotals(transactions, expenses),
    [transactions, expenses],
  );
  const monthly = React.useMemo(
    () => monthlySeries(transactions, expenses, 6),
    [transactions, expenses],
  );
  const categories = React.useMemo(() => expensesByCategory(expenses), [expenses]);

  if (loading) return <DashboardSkeleton />;

  const firstName = (settings.ownerName || OWNER_NAME).split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's a complete snapshot of your money."
        actions={
          <div className="flex gap-2">
            <ExpenseFormDialog
              trigger={
                <Button variant="outline">
                  <Receipt className="size-4" /> Expense
                </Button>
              }
            />
            <TransactionFormDialog
              defaultType="given"
              trigger={
                <Button>
                  <Wallet className="size-4" /> Transaction
                </Button>
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Money Given" value={totals.totalGiven} icon={ArrowUpRight} accent="danger" index={0} />
        <StatCard label="Total Money Received" value={totals.totalReceived} icon={ArrowDownLeft} accent="success" index={1} />
        <StatCard label="Pending Amount" value={totals.pending} icon={Clock} accent="primary" index={2} />
        <StatCard label="Total Expenses" value={totals.totalExpenses} icon={Receipt} accent="warning" index={3} />
        <StatCard label="Current Cash Flow" value={totals.cashFlow} icon={TrendingUp} accent="neutral" colored index={4} />
        <StatCard label="This Month Income" value={totals.thisMonthIncome} icon={Banknote} accent="success" index={5} />
        <StatCard label="This Month Expense" value={totals.thisMonthExpense} icon={Receipt} accent="warning" index={6} />
        <StatCard label="This Month Collection" value={totals.thisMonthCollection} icon={CalendarRange} accent="primary" index={7} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <IncomeVsExpenseChart data={monthly} />
        <CashFlowChart data={monthly} />
        <MonthlyExpensesChart data={monthly} />
        <MonthlyCollectionsChart data={monthly} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CategoryPieChart data={categories} />
        </div>
        <div className="lg:col-span-2">
          <SummaryStrip
            people={peopleWithBalance.length}
            txns={transactions.length}
            expenses={expenses.length}
          />
        </div>
      </div>

      <DashboardWidgets />
    </div>
  );
}

function SummaryStrip({
  people,
  txns,
  expenses,
}: {
  people: number;
  txns: number;
  expenses: number;
}) {
  const items = [
    { label: "People tracked", value: people },
    { label: "Transactions", value: txns },
    { label: "Expenses logged", value: expenses },
  ];
  return (
    <Card className="flex h-full flex-col justify-center gap-4 p-6 sm:flex-row sm:items-center sm:justify-around">
      {items.map((i) => (
        <div key={i.label} className="text-center">
          <p className="text-3xl font-semibold tracking-tight">{i.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-56 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
