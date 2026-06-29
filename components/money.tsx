"use client";

import { useCurrency } from "@/lib/ledger-store";
import { cn, formatCurrency } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  className?: string;
  /** Color by sign: positive green, negative red. */
  colored?: boolean;
  signed?: boolean;
}

export function Money({ amount, className, colored, signed }: MoneyProps) {
  const currency = useCurrency();
  const formatted = formatCurrency(Math.abs(amount), currency);
  const sign = amount < 0 ? "−" : signed ? "+" : "";
  return (
    <span
      className={cn(
        "tabular-nums",
        colored && amount > 0 && "text-success",
        colored && amount < 0 && "text-danger",
        className,
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
