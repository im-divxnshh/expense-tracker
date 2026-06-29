"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validation";
import { useLedger } from "@/lib/ledger-store";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/constants";
import { todayISO } from "@/lib/utils";
import type { Expense } from "@/types";

interface ExpenseFormDialogProps {
  expense?: Expense;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function toDefaults(e?: Expense): ExpenseFormValues {
  return {
    title: e?.title ?? "",
    category: e?.category ?? "Food",
    amount: e?.amount ?? ("" as unknown as number),
    date: e?.date ?? todayISO(),
    method: e?.method ?? "cash",
    notes: e?.notes ?? "",
    receiptUrl: e?.receiptUrl ?? "",
  };
}

export function ExpenseFormDialog({
  expense,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ExpenseFormDialogProps) {
  const { addExpense, updateExpense } = useLedger();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = Boolean(expense);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: toDefaults(expense),
  });

  React.useEffect(() => {
    if (open) reset(toDefaults(expense));
  }, [open, expense, reset]);

  async function onSubmit(values: ExpenseFormValues) {
    const payload = {
      title: values.title.trim(),
      category: values.category,
      amount: Number(values.amount),
      date: values.date,
      method: values.method,
      notes: values.notes || "",
      receiptUrl: values.receiptUrl || "",
    };
    try {
      if (isEdit && expense) await updateExpense(expense.id, payload);
      else await addExpense(payload);
      setOpen(false);
    } catch {
      /* toast handled in store */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Record a personal expense.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" placeholder="e.g. Groceries" {...register("title")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Amount" htmlFor="amount" required error={errors.amount?.message}>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
              />
            </Field>

            <Field label="Date" htmlFor="date" required error={errors.date?.message}>
              <Input id="date" type="date" {...register("date")} />
            </Field>

            <Field label="Payment method" error={errors.method?.message}>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field
            label="Receipt URL"
            htmlFor="receiptUrl"
            error={errors.receiptUrl?.message}
            hint="Optional link to a receipt image."
          >
            <Input
              id="receiptUrl"
              placeholder="https://…"
              {...register("receiptUrl")}
            />
          </Field>

          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" placeholder="Optional note…" {...register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
