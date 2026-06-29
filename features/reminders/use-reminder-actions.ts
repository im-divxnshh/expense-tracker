"use client";

import * as React from "react";
import { useLedger } from "@/lib/ledger-store";
import { todayISO } from "@/lib/utils";
import type { PaymentMethod, PersonWithBalance } from "@/types";

/**
 * Shared reminder/collection actions used by both the notification bell and
 * the Reminders page so the behaviour stays identical everywhere.
 */
export function useReminderActions() {
  const { addTransaction, updatePerson } = useLedger();

  /** Record the full outstanding balance as received — settles the person. */
  const markReceived = React.useCallback(
    (person: PersonWithBalance, method: PaymentMethod = "cash") => {
      if (person.pending <= 0) return Promise.resolve(undefined);
      return addTransaction({
        personId: person.id,
        type: "received",
        amount: person.pending,
        date: todayISO(),
        method,
        notes: "Payment received via reminder",
      });
    },
    [addTransaction],
  );

  /** Mark as settled and clear the reminder without recording any money. */
  const markComplete = React.useCallback(
    (person: PersonWithBalance) =>
      updatePerson(person.id, {
        status: "settled",
        dueDate: null,
        reminderDate: null,
      }),
    [updatePerson],
  );

  /** Log that a reminder was sent (bumps the reminder counter). */
  const markReminded = React.useCallback(
    (person: PersonWithBalance) =>
      updatePerson(person.id, {
        lastRemindedAt: Date.now(),
        reminderCount: (person.reminderCount ?? 0) + 1,
      }),
    [updatePerson],
  );

  return { markReceived, markComplete, markReminded };
}
