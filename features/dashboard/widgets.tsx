"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { CategoryBadge } from "@/components/badges";
import { useLedger } from "@/lib/ledger-store";
import {
  reminderItems,
  sortByDateDesc,
} from "@/lib/selectors";
import { formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BellRing,
  ChevronRight,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { ReminderBucket } from "@/types";

function WidgetCard({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {href && (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href={href}>
              View all <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

const bucketBadge: Record<ReminderBucket, { label: string; variant: "danger" | "warning" | "default" | "secondary" }> = {
  overdue: { label: "Overdue", variant: "danger" },
  today: { label: "Due today", variant: "warning" },
  tomorrow: { label: "Tomorrow", variant: "warning" },
  upcoming: { label: "Upcoming", variant: "secondary" },
};

export function DashboardWidgets() {
  const { peopleWithBalance, transactions, expenses, people } = useLedger();

  const pending = React.useMemo(
    () =>
      peopleWithBalance
        .filter((p) => p.pending > 0)
        .sort((a, b) => b.pending - a.pending)
        .slice(0, 5),
    [peopleWithBalance],
  );

  const reminders = React.useMemo(
    () => reminderItems(peopleWithBalance).slice(0, 5),
    [peopleWithBalance],
  );

  const latestTxns = React.useMemo(
    () => sortByDateDesc(transactions).slice(0, 5),
    [transactions],
  );

  const latestExpenses = React.useMemo(
    () => sortByDateDesc(expenses).slice(0, 5),
    [expenses],
  );

  const recentPeople = React.useMemo(
    () => [...peopleWithBalance].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [peopleWithBalance],
  );

  const nameOf = React.useMemo(
    () => new Map(people.map((p) => [p.id, p.fullName])),
    [people],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <WidgetCard title="Pending Payments" href="/people">
        {pending.length === 0 ? (
          <EmptyRow text="No outstanding balances 🎉" />
        ) : (
          <ul className="space-y-1">
            {pending.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/people/${p.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                >
                  <Avatar name={p.fullName} src={p.profileImageUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.transactionCount} transactions
                    </p>
                  </div>
                  <Money amount={p.pending} className="font-semibold text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="Upcoming Reminders" href="/reminders">
        {reminders.length === 0 ? (
          <EmptyRow text="No reminders set." />
        ) : (
          <ul className="space-y-1">
            {reminders.map((r) => (
              <li key={r.person.id}>
                <Link
                  href={`/people/${r.person.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
                    <BellRing className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.person.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(r.dueDate)}
                    </p>
                  </div>
                  <Badge variant={bucketBadge[r.bucket].variant}>
                    {bucketBadge[r.bucket].label}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="Latest Transactions" href="/transactions">
        {latestTxns.length === 0 ? (
          <EmptyRow text="No transactions yet." />
        ) : (
          <ul className="space-y-1">
            {latestTxns.map((t) => {
              const given = t.type === "given";
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div
                    className={`flex size-9 items-center justify-center rounded-full ${
                      given ? "bg-danger/12 text-danger" : "bg-success/12 text-success"
                    }`}
                  >
                    {given ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownLeft className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {nameOf.get(t.personId) ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                  </div>
                  <Money
                    amount={given ? -t.amount : t.amount}
                    colored
                    signed
                    className="font-semibold"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="Latest Expenses" href="/expenses">
        {latestExpenses.length === 0 ? (
          <EmptyRow text="No expenses yet." />
        ) : (
          <ul className="space-y-1">
            {latestExpenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Receipt className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <div className="mt-0.5">
                    <CategoryBadge category={e.category} />
                  </div>
                </div>
                <Money amount={e.amount} className="font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard title="Recent People" href="/people">
        {recentPeople.length === 0 ? (
          <EmptyRow text="No people added yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentPeople.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm transition-colors hover:bg-muted"
              >
                <Avatar name={p.fullName} src={p.profileImageUrl} size="sm" />
                {p.fullName}
              </Link>
            ))}
          </div>
        )}
      </WidgetCard>

      <WidgetCard title="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          <QuickAction href="/people" icon={Users} label="Manage people" />
          <QuickAction href="/transactions" icon={Wallet} label="Add transaction" />
          <QuickAction href="/expenses" icon={Receipt} label="Add expense" />
          <QuickAction href="/reports" icon={ArrowUpRight} label="View reports" />
        </div>
      </WidgetCard>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
    >
      <Icon className="size-4 text-primary" />
      {label}
    </Link>
  );
}
