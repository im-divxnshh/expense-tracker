"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlarmClock,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Eye,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/money";
import { reminderItems } from "@/lib/selectors";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReminderBucket, ReminderItem } from "@/types";

const BUCKETS: {
  key: ReminderBucket;
  title: string;
  variant: "danger" | "warning" | "secondary";
}[] = [
  { key: "overdue", title: "Overdue", variant: "danger" },
  { key: "today", title: "Due today", variant: "warning" },
  { key: "tomorrow", title: "Tomorrow", variant: "warning" },
  { key: "upcoming", title: "Upcoming", variant: "secondary" },
];

function relativeLabel(item: ReminderItem): string {
  const d = item.daysDiff;
  if (d < 0) return `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

export function RemindersPage() {
  const { peopleWithBalance, loading, updatePerson, settings } = useLedger();

  const items = React.useMemo(
    () => reminderItems(peopleWithBalance),
    [peopleWithBalance],
  );

  const grouped = React.useMemo(() => {
    const map = new Map<ReminderBucket, ReminderItem[]>();
    for (const b of BUCKETS) map.set(b.key, []);
    for (const item of items) map.get(item.bucket)?.push(item);
    return map;
  }, [items]);

  const stats = React.useMemo(() => {
    const overdue = items.filter((i) => i.bucket === "overdue");
    const today = items.filter((i) => i.bucket === "today");
    return {
      overdueAmount: overdue.reduce((s, i) => s + i.person.pending, 0),
      todayAmount: today.reduce((s, i) => s + i.person.pending, 0),
      totalAmount: items.reduce((s, i) => s + i.person.pending, 0),
      followUps: items.length,
    };
  }, [items]);

  const markReminded = React.useCallback(
    (item: ReminderItem) =>
      updatePerson(item.person.id, {
        lastRemindedAt: Date.now(),
        reminderCount: (item.person.reminderCount ?? 0) + 1,
      }),
    [updatePerson],
  );

  function whatsappHref(item: ReminderItem): string {
    const phone = (item.person.phone ?? "").replace(/[^\d]/g, "");
    const amount = formatCurrency(item.person.pending, settings.currency);
    const text = encodeURIComponent(
      `Hi ${item.person.fullName}, a friendly reminder about the pending amount of ${amount}. Thank you!`,
    );
    return `https://wa.me/${phone}?text=${text}`;
  }

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Follow up on due dates and pending collections before they slip."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Overdue"
          icon={AlarmClock}
          accent="danger"
          loading={loading}
          display={<Money amount={stats.overdueAmount} />}
        />
        <KpiCard
          label="Due today"
          icon={CalendarClock}
          accent="warning"
          loading={loading}
          display={<Money amount={stats.todayAmount} />}
        />
        <KpiCard
          label="Total to collect"
          icon={BellRing}
          accent="primary"
          loading={loading}
          display={<Money amount={stats.totalAmount} />}
        />
        <KpiCard
          label="People to follow up"
          icon={Users}
          accent="neutral"
          loading={loading}
          display={stats.followUps}
        />
      </div>

      {loading ? (
        <Card className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear — nothing to chase"
          description="People with a due date and an outstanding balance show up here. Set a due date on a person to start tracking reminders."
          action={
            <Button asChild variant="outline">
              <Link href="/people">
                <Users className="size-4" /> Go to people
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {BUCKETS.map((bucket) => {
            const list = grouped.get(bucket.key) ?? [];
            if (list.length === 0) return null;
            return (
              <Card key={bucket.key} className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {bucket.title}
                    <Badge variant={bucket.variant}>{list.length}</Badge>
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    <Money amount={list.reduce((s, i) => s + i.person.pending, 0)} />
                  </span>
                </CardHeader>
                <CardContent className="space-y-1">
                  {list.map((item, i) => (
                    <ReminderRow
                      key={item.person.id}
                      item={item}
                      index={i}
                      whatsappHref={whatsappHref(item)}
                      onRemind={() => markReminded(item)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReminderRow({
  item,
  index,
  whatsappHref,
  onRemind,
}: {
  item: ReminderItem;
  index: number;
  whatsappHref: string;
  onRemind: () => void;
}) {
  const { person } = item;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex flex-col gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
    >
      <Link
        href={`/people/${person.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary"
      >
        <Avatar name={person.fullName} src={person.profileImageUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{person.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {relativeLabel(item)} · {formatDate(item.dueDate)}
            {person.reminderCount
              ? ` · reminded ${person.reminderCount}×`
              : ""}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Money amount={person.pending} className="font-semibold text-primary" />
        <div className="flex items-center gap-1">
          {person.phone && (
            <>
              <Button asChild variant="ghost" size="icon-sm" aria-label="Call">
                <a href={`tel:${person.phone}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon-sm" aria-label="WhatsApp">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                </a>
              </Button>
            </>
          )}
          <Button asChild variant="ghost" size="icon-sm" aria-label="View profile">
            <Link href={`/people/${person.id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onRemind}>
            <CheckCircle2 className="size-4" /> Remind
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

const accentMap = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/20 text-warning-foreground",
  neutral: "bg-muted text-muted-foreground",
} as const;

function KpiCard({
  label,
  icon: Icon,
  accent,
  display,
  loading,
}: {
  label: string;
  icon: typeof BellRing;
  accent: keyof typeof accentMap;
  display: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card glass className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {loading ? <Skeleton className="h-7 w-24" /> : display}
          </div>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
