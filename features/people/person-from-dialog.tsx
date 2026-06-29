"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookUser, UserPlus } from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Person, PersonStatus } from "@/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const schema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(30).optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Types for the Contact Picker API (not yet in @types/web)
// ---------------------------------------------------------------------------
interface ContactAddress {
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
  streetAddress?: string;
}

interface ContactInfo {
  address?: ContactAddress[];
  email?: string[];
  icon?: Blob[];
  name?: string[];
  tel?: string[];
}

interface ContactsManager {
  select(
    properties: string[],
    options?: { multiple?: boolean },
  ): Promise<ContactInfo[]>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
  interface Window {
    ContactsManager?: unknown;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PersonFormDialogProps {
  /** The element that opens the dialog (used as an uncontrolled trigger). */
  trigger?: React.ReactNode;
  /** When provided, the dialog is controlled externally. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pre-fill the form for editing an existing person. */
  person?: Person;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PersonFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  person,
}: PersonFormDialogProps) {
  const { addPerson, updatePerson } = useLedger();
  const isEditing = !!person;

  // Uncontrolled open state (used when no external control is provided)
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };

  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: person?.fullName ?? "",
      phone: person?.phone ?? "",
      profileImageUrl: person?.profileImageUrl ?? "",
    },
  });

  // Reset when the dialog opens for a different person (or as new)
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        fullName: person?.fullName ?? "",
        phone: person?.phone ?? "",
        profileImageUrl: person?.profileImageUrl ?? "",
      });
    }
  }, [isOpen, person, form]);

  // -------------------------------------------------------------------------
  // Contact import — lives here because `form` is in scope
  // -------------------------------------------------------------------------
  async function importContact() {
    setImportError(null);

    if (!("contacts" in navigator)) {
      setImportError(
        "Contact import isn't supported on this browser. Open the app on your Android or iOS phone to use this feature.",
      );
      return;
    }

    setImporting(true);
    try {
      const contacts = await (navigator as any).contacts.select(
        ["name", "tel"],
        {
          multiple: false,
        },
      );
      const contact = contacts?.[0];
      if (contact) {
        const name = contact.name?.[0]?.trim();
        const tel = contact.tel?.[0]?.trim();
        if (name) form.setValue("fullName", name, { shouldValidate: true });
        if (tel) form.setValue("phone", tel, { shouldValidate: true });
      }
    } catch {
      // User cancelled — no error needed
    } finally {
      setImporting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Submit — spreads FormValues and adds the `status` field NewPerson requires
  // -------------------------------------------------------------------------
  async function onSubmit(values: FormValues) {
    if (isEditing && person) {
      await updatePerson(person.id, values);
    } else {
      await addPerson({
        fullName: values.fullName,
        phone: values.phone ?? "",
        profileImageUrl: values.profileImageUrl ?? "",
        status: "active" satisfies PersonStatus,
      });
    }
    setOpen(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) form.reset();
      }}
    >
      {/* Uncontrolled trigger */}
      {trigger && (
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          style={{ display: "contents" }}
        >
          {trigger}
        </span>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit person" : "Add person"}</DialogTitle>
        </DialogHeader>

        {/* Contact import — always visible, works on Android/iOS/macOS Safari */}
        {!isEditing && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Fill from your contacts
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={importContact}
              >
                <BookUser className="size-4" />
                {importing ? "Importing…" : "Import contact"}
              </Button>
            </div>
            {importError && (
              <p className="text-xs text-destructive leading-snug">
                {importError}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          id="person-form"
        >
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Full name</Label>
            <Input
              id="pf-name"
              placeholder="Jane Smith"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-phone">
              Phone{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="pf-phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Profile image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-img">
              Profile image URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="pf-img"
              type="url"
              placeholder="https://…"
              autoComplete="url"
              aria-invalid={!!errors.profileImageUrl}
              {...register("profileImageUrl")}
            />
            {errors.profileImageUrl && (
              <p className="text-xs text-destructive">
                {errors.profileImageUrl.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="person-form" disabled={isSubmitting}>
            <UserPlus className="size-4" />
            {isSubmitting
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Add person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
