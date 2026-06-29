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
import { personSchema, type PersonFormValues } from "@/lib/validation";
import { useLedger } from "@/lib/ledger-store";
import type { Person } from "@/types";

interface PersonFormDialogProps {
  person?: Person;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function toDefaults(person?: Person): PersonFormValues {
  return {
    fullName: person?.fullName ?? "",
    phone: person?.phone ?? "",
    address: person?.address ?? "",
    notes: person?.notes ?? "",
    dueDate: person?.dueDate ?? "",
    reminderDate: person?.reminderDate ?? "",
    reminderNotes: person?.reminderNotes ?? "",
    status: person?.status ?? "active",
    profileImageUrl: person?.profileImageUrl ?? "",
  };
}

export function PersonFormDialog({
  person,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: PersonFormDialogProps) {
  const { addPerson, updatePerson } = useLedger();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = Boolean(person);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: toDefaults(person),
  });

  React.useEffect(() => {
    if (open) reset(toDefaults(person));
  }, [open, person, reset]);

  async function onSubmit(values: PersonFormValues) {
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone || "",
      address: values.address || "",
      notes: values.notes || "",
      dueDate: values.dueDate || null,
      reminderDate: values.reminderDate || null,
      reminderNotes: values.reminderNotes || "",
      status: values.status ?? "active",
      profileImageUrl: values.profileImageUrl || "",
    };
    try {
      if (isEdit && person) await updatePerson(person.id, payload);
      else await addPerson(payload);
      setOpen(false);
    } catch {
      /* handled with toast in store */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit person" : "Add person"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this person's details and reminders."
              : "Add someone to your ledger to track money given and received."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="fullName"
              required
              error={errors.fullName?.message}
              className="sm:col-span-2"
            >
              <Input id="fullName" placeholder="e.g. Rahul Sharma" {...register("fullName")} />
            </Field>

            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
            </Field>

            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="address"
              error={errors.address?.message}
              className="sm:col-span-2"
            >
              <Input id="address" placeholder="City, area…" {...register("address")} />
            </Field>

            <Field label="Due date" htmlFor="dueDate" error={errors.dueDate?.message}>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </Field>

            <Field
              label="Reminder date"
              htmlFor="reminderDate"
              error={errors.reminderDate?.message}
            >
              <Input id="reminderDate" type="date" {...register("reminderDate")} />
            </Field>

            <Field
              label="Notes"
              htmlFor="notes"
              error={errors.notes?.message}
              className="sm:col-span-2"
            >
              <Textarea id="notes" placeholder="Anything to remember…" {...register("notes")} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Add person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
