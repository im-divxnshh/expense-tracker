"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/badges";
import { PersonFormDialog } from "./person-form-dialog";
import { formatDate } from "@/lib/utils";
import type { Person, PersonWithBalance } from "@/types";

type SortKey = "name" | "pending" | "given" | "received" | "recent";
const PAGE_SIZE = 8;

export function PeoplePage() {
  const { peopleWithBalance, loading, deletePerson } = useLedger();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent");
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Person | null>(null);
  const [deleting, setDeleting] = React.useState<PersonWithBalance | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = peopleWithBalance.filter(
      (p) =>
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q),
    );
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "pending":
          return b.pending - a.pending;
        case "given":
          return b.totalGiven - a.totalGiven;
        case "received":
          return b.totalReceived - a.totalReceived;
        default:
          return (b.lastTransactionDate ?? "").localeCompare(
            a.lastTransactionDate ?? "",
          );
      }
    });
    return sorted;
  }, [peopleWithBalance, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  React.useEffect(() => setPage(1), [query, sort]);

  function cycleSort() {
    const order: SortKey[] = ["recent", "name", "pending", "given", "received"];
    setSort((s) => order[(order.indexOf(s) + 1) % order.length]);
  }

  return (
    <div>
      <PageHeader
        title="People"
        description="Everyone you have lent to or received money from."
        actions={
          <PersonFormDialog
            trigger={
              <Button>
                <Plus className="size-4" /> Add person
              </Button>
            }
          />
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={cycleSort} className="capitalize">
          <ArrowUpDown className="size-4" /> Sort: {sort}
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "No matches" : "No people yet"}
          description={
            query
              ? "Try a different search term."
              : "Add the first person to start tracking money given and received."
          }
          action={
            !query && (
              <PersonFormDialog
                trigger={
                  <Button>
                    <Plus className="size-4" /> Add person
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
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Given</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <Link
                      href={`/people/${p.id}`}
                      className="flex items-center gap-3 font-medium hover:text-primary"
                    >
                      <Avatar name={p.fullName} src={p.profileImageUrl} size="sm" />
                      <div className="leading-tight">
                        <p>{p.fullName}</p>
                        {p.phone && (
                          <p className="text-xs font-normal text-muted-foreground">
                            {p.phone}
                          </p>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Money amount={p.totalGiven} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money amount={p.totalReceived} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <Money amount={p.pending} colored />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.pending <= 0 ? "settled" : p.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.lastTransactionDate ? formatDate(p.lastTransactionDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/people/${p.id}`}>
                            <Eye className="size-4" /> View profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(p)}>
                          <Pencil className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="danger"
                          onClick={() => setDeleting(p)}
                        >
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
            Page {current} of {totalPages} · {filtered.length} people
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

      {/* Edit dialog (controlled) */}
      {editing && (
        <PersonFormDialog
          person={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.fullName}?`}
        description="This removes the person from your active ledger. Their transactions remain recorded."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleting) await deletePerson(deleting.id);
        }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </Card>
  );
}
