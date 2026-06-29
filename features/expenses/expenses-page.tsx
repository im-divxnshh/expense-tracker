"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { CategoryBadge, MethodBadge } from "@/components/badges";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { sortByDateDesc } from "@/lib/selectors";
import { formatDate, toDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/constants";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/types";

const PAGE_SIZE = 12;

export function ExpensesPage() {
  const { expenses, loading, deleteExpense } = useLedger();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory | "all">("all");
  const [method, setMethod] = React.useState<PaymentMethod | "all">("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [deleting, setDeleting] = React.useState<Expense | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromD = toDate(from);
    const toD = toDate(to);
    const list = expenses.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (method !== "all" && e.method !== method) return false;
      if (q && !e.title.toLowerCase().includes(q) && !(e.notes ?? "").toLowerCase().includes(q))
        return false;
      const d = toDate(e.date);
      if (fromD && d && d < fromD) return false;
      if (toD && d && d > toD) return false;
      return true;
    });
    return sortByDateDesc(list);
  }, [expenses, query, category, method, from, to]);

  const total = React.useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  React.useEffect(() => setPage(1), [query, category, method, from, to]);

  const hasFilters = query || category !== "all" || method !== "all" || from || to;

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Your personal spending across every category."
        actions={
          <ExpenseFormDialog
            trigger={
              <Button>
                <Plus className="size-4" /> Add expense
              </Button>
            }
          />
        }
      />

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or note…"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
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

      {!loading && filtered.length > 0 && (
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">
              Showing {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
            </span>
            <span className="text-sm font-semibold">
              Total: <Money amount={total} />
            </span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="space-y-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No matching expenses" : "No expenses yet"}
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Add your first expense to start tracking spending."
          }
          action={
            !hasFilters && (
              <ExpenseFormDialog
                trigger={
                  <Button>
                    <Plus className="size-4" /> Add expense
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {e.title}
                      {e.receiptUrl && (
                        <a
                          href={e.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          aria-label="Open receipt"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {e.notes && (
                      <p className="text-xs font-normal text-muted-foreground">{e.notes}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={e.category} />
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={e.method} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(e.date)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <Money amount={e.amount} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(e)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="danger" onClick={() => setDeleting(e)}>
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {current} of {totalPages} · {filtered.length} expenses
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
        <ExpenseFormDialog
          expense={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete expense?"
        description={`"${deleting?.title}" will be removed from your records.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleting) await deleteExpense(deleting.id);
        }}
      />
    </div>
  );
}
