"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/money";
import { MethodBadge, TypeBadge } from "@/components/badges";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { sortByDateDesc } from "@/lib/selectors";
import { formatDate, toDate } from "@/lib/utils";
import type { PaymentMethod, Transaction, TransactionType } from "@/types";

const PAGE_SIZE = 12;

export function TransactionsPage() {
  const { transactions, people, loading, deleteTransaction } = useLedger();
  const personName = React.useMemo(
    () => new Map(people.map((p) => [p.id, p.fullName])),
    [people],
  );

  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<TransactionType | "all">("all");
  const [method, setMethod] = React.useState<PaymentMethod | "all">("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromD = toDate(from);
    const toD = toDate(to);
    const list = transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (method !== "all" && t.method !== method) return false;
      const name = personName.get(t.personId)?.toLowerCase() ?? "";
      if (q && !name.includes(q) && !(t.notes ?? "").toLowerCase().includes(q))
        return false;
      const d = toDate(t.date);
      if (fromD && d && d < fromD) return false;
      if (toD && d && d > toD) return false;
      return true;
    });
    return sortByDateDesc(list);
  }, [transactions, query, type, method, from, to, personName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  React.useEffect(() => setPage(1), [query, type, method, from, to]);

  const hasFilters = query || type !== "all" || method !== "all" || from || to;

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="All money given and received, across everyone."
        actions={
          <div className="flex gap-2">
            <TransactionFormDialog
              defaultType="received"
              trigger={
                <Button variant="outline">
                  <ArrowDownLeft className="size-4" /> Received
                </Button>
              }
            />
            <TransactionFormDialog
              defaultType="given"
              trigger={
                <Button>
                  <Plus className="size-4" /> Given
                </Button>
              }
            />
          </div>
        }
      />

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search person or note…"
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="given">Given</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={hasFilters ? "No matching transactions" : "No transactions yet"}
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Record money you give or receive to build your ledger."
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((t, i) => {
                const given = t.type === "given";
                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <Link
                        href={`/people/${t.personId}`}
                        className="flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <span
                          className={`flex size-7 items-center justify-center rounded-full ${
                            given
                              ? "bg-danger/12 text-danger"
                              : "bg-success/12 text-success"
                          }`}
                        >
                          {given ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownLeft className="size-3.5" />
                          )}
                        </span>
                        {personName.get(t.personId) ?? "Unknown"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={t.type} />
                    </TableCell>
                    <TableCell>
                      <MethodBadge method={t.method} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money amount={given ? -t.amount : t.amount} colored signed />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(t)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="danger"
                            onClick={() => setDeleting(t)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {current} of {totalPages} · {filtered.length} transactions
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <TransactionFormDialog
          transaction={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete transaction?"
        description="This transaction will be removed and balances recalculated."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleting) await deleteTransaction(deleting.id);
        }}
      />
    </div>
  );
}
