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
import { transactionSchema, type TransactionFormValues } from "@/lib/validation";
import { useLedger } from "@/lib/ledger-store";
import { PAYMENT_METHODS } from "@/constants";
import { todayISO } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types";

interface TransactionFormDialogProps {
  transaction?: Transaction;
  defaultType?: TransactionType;
  defaultPersonId?: string;
  lockPerson?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function toDefaults(
  t?: Transaction,
  defaultType: TransactionType = "given",
  defaultPersonId = "",
): TransactionFormValues {
  return {
    personId: t?.personId ?? defaultPersonId,
    type: t?.type ?? defaultType,
    amount: t?.amount ?? ("" as unknown as number),
    date: t?.date ?? todayISO(),
    method: t?.method ?? "cash",
    notes: t?.notes ?? "",
  };
}

export function TransactionFormDialog({
  transaction,
  defaultType = "given",
  defaultPersonId = "",
  lockPerson,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: TransactionFormDialogProps) {
  const { peopleWithBalance, addTransaction, updateTransaction } = useLedger();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = Boolean(transaction);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: toDefaults(transaction, defaultType, defaultPersonId),
  });

  React.useEffect(() => {
    if (open) reset(toDefaults(transaction, defaultType, defaultPersonId));
  }, [open, transaction, defaultType, defaultPersonId, reset]);

  async function onSubmit(values: TransactionFormValues) {
    const payload = {
      personId: values.personId,
      type: values.type,
      amount: Number(values.amount),
      date: values.date,
      method: values.method,
      notes: values.notes || "",
    };
    try {
      if (isEdit && transaction) await updateTransaction(transaction.id, payload);
      else await addTransaction(payload);
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
          <DialogTitle>{isEdit ? "Edit transaction" : "Record transaction"}</DialogTitle>
          <DialogDescription>
            Money given is what you lend out; money received is what comes back.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange("given")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    field.value === "given"
                      ? "border-danger bg-danger/10 text-danger"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Money Given
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("received")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    field.value === "received"
                      ? "border-success bg-success/10 text-success"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Money Received
                </button>
              </div>
            )}
          />

          <Field label="Person" required error={errors.personId?.message}>
            <Controller
              control={control}
              name="personId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={lockPerson}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {peopleWithBalance.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        Add a person first
                      </div>
                    )}
                    {peopleWithBalance.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

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

          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" placeholder="Optional note…" {...register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Save transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
