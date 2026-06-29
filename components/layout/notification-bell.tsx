"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ChevronRight } from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { reminderItems } from "@/lib/selectors";
import { useReminderActions } from "@/features/reminders/use-reminder-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/money";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReminderBucket, ReminderItem } from "@/types";

const bucketMeta: Record<
  ReminderBucket,
  { label: string; variant: "danger" | "warning" | "secondary" }
> = {
  overdue: { label: "Overdue", variant: "danger" },
  today: { label: "Due today", variant: "warning" },
  tomorrow: { label: "Tomorrow", variant: "warning" },
  upcoming: { label: "Upcoming", variant: "secondary" },
};

const MAX_VISIBLE = 6;

export function NotificationBell() {
  const { peopleWithBalance } = useLedger();
  const { markReceived, markComplete } = useReminderActions();

  const items = React.useMemo(
    () => reminderItems(peopleWithBalance),
    [peopleWithBalance],
  );

  const urgent = React.useMemo(
    () => items.filter((i) => i.bucket === "overdue" || i.bucket === "today").length,
    [items],
  );
  const count = items.length;
  const visible = items.slice(0, MAX_VISIBLE);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={`Notifications${count ? ` (${count})` : ""}`}
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span
              className={cn(
                "absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
                urgent > 0 ? "bg-danger" : "bg-primary",
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {count > 0 && (
            <Badge variant={urgent > 0 ? "danger" : "secondary"}>
              {urgent > 0 ? `${urgent} due now` : `${count} upcoming`}
            </Badge>
          )}
        </div>

        {count === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCheck className="size-6" />
            </div>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No payments are due right now.
            </p>
          </div>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {visible.map((item) => (
              <NotificationRow
                key={item.person.id}
                item={item}
                onReceived={() => markReceived(item.person)}
                onComplete={() => markComplete(item.person)}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-border p-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground"
          >
            <Link href="/reminders">
              View all reminders
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  item,
  onReceived,
  onComplete,
}: {
  item: ReminderItem;
  onReceived: () => void;
  onComplete: () => void;
}) {
  const { person } = item;
  const meta = bucketMeta[item.bucket];
  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <Link href={`/people/${person.id}`} className="shrink-0">
        <Avatar name={person.fullName} src={person.profileImageUrl} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/people/${person.id}`}
            className="truncate text-sm font-medium hover:text-primary"
          >
            {person.fullName}
          </Link>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <Money amount={person.pending} className="font-medium text-primary" /> pending
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-success hover:bg-success/10"
          aria-label="Mark payment received"
          title="Mark payment received"
          onClick={onReceived}
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Mark complete"
          title="Mark complete (settle &amp; clear)"
          onClick={onComplete}
        >
          <CheckCheck className="size-4" />
        </Button>
      </div>
    </li>
  );
}
