"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  CalendarClock,
  ArrowDownLeft,
  ArrowUpRight,
  StickyNote,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Money } from "@/components/money";
import { MethodBadge, StatusBadge } from "@/components/badges";
import { PersonFormDialog } from "./person-form-dialog";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { sortByDateDesc } from "@/lib/selectors";
import { formatDate } from "@/lib/utils";

export function PersonDetail({ personId }: { personId: string }) {
  const router = useRouter();
  const { getPerson, transactions, loading, deletePerson } = useLedger();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const person = getPerson(personId);
  const personTxns = React.useMemo(
    () => sortByDateDesc(transactions.filter((t) => t.personId === personId)),
    [transactions, personId],
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!person) {
    return (
      <EmptyState
        title="Person not found"
        description="This person may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/people">
              <ArrowLeft className="size-4" /> Back to people
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/people">
          <ArrowLeft className="size-4" /> Back to people
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={person.fullName} src={person.profileImageUrl} size="lg" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{person.fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {person.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" /> {person.phone}
                </span>
              )}
              {person.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {person.address}
                </span>
              )}
              <StatusBadge status={person.pending <= 0 ? "settled" : person.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TransactionFormDialog
            defaultType="given"
            defaultPersonId={person.id}
            lockPerson
            trigger={
              <Button>
                <Plus className="size-4" /> Add transaction
              </Button>
            }
          />
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat label="Total given" value={person.totalGiven} accent="danger" />
        <SummaryStat
          label="Total received"
          value={person.totalReceived}
          accent="success"
        />
        <SummaryStat label="Pending balance" value={person.pending} accent="primary" />
      </div>

      {(person.dueDate || person.reminderDate || person.notes) && (
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            {(person.dueDate || person.reminderDate) && (
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
                <div className="text-sm">
                  {person.dueDate && (
                    <p>
                      <span className="text-muted-foreground">Due date: </span>
                      {formatDate(person.dueDate)}
                    </p>
                  )}
                  {person.reminderDate && (
                    <p>
                      <span className="text-muted-foreground">Reminder: </span>
                      {formatDate(person.reminderDate)}
                    </p>
                  )}
                  {person.reminderNotes && (
                    <p className="text-muted-foreground">{person.reminderNotes}</p>
                  )}
                </div>
              </div>
            )}
            {person.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 size-4 text-muted-foreground" />
                <p className="text-sm">{person.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Transaction timeline</CardTitle>
          <span className="text-sm text-muted-foreground">
            {personTxns.length} {personTxns.length === 1 ? "entry" : "entries"}
          </span>
        </CardHeader>
        <CardContent>
          {personTxns.length === 0 ? (
            <EmptyState
              icon={ArrowUpRight}
              title="No transactions yet"
              description="Record the first money given or received for this person."
              className="border-0 py-8"
            />
          ) : (
            <ol className="relative space-y-1">
              {personTxns.map((t, i) => {
                const given = t.type === "given";
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 rounded-lg px-2 py-2.5 hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
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
                      <p className="text-sm font-medium">
                        {given ? "Money given" : "Money received"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(t.date)} · {t.notes || "No note"}
                      </p>
                    </div>
                    <MethodBadge method={t.method} />
                    <Money
                      amount={given ? -t.amount : t.amount}
                      colored
                      signed
                      className="w-28 text-right font-semibold"
                    />
                  </motion.li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <PersonFormDialog person={person} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${person.fullName}?`}
        description="This removes the person from your active ledger."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deletePerson(person.id);
          router.push("/people");
        }}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "danger" | "success" | "primary";
}) {
  const accentClass =
    accent === "danger"
      ? "text-danger"
      : accent === "success"
        ? "text-success"
        : "text-primary";
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>
          <Money amount={value} />
        </p>
      </CardContent>
    </Card>
  );
}
