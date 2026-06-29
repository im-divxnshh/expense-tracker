import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, PAYMENT_METHOD_LABEL } from "@/constants";
import type { ExpenseCategory, PaymentMethod, PersonStatus, TransactionType } from "@/types";

export function MethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge variant="secondary">{PAYMENT_METHOD_LABEL[method]}</Badge>;
}

export function CategoryBadge({ category }: { category: ExpenseCategory }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {category}
    </span>
  );
}

export function TypeBadge({ type }: { type: TransactionType }) {
  return type === "given" ? (
    <Badge variant="danger">Given</Badge>
  ) : (
    <Badge variant="success">Received</Badge>
  );
}

export function StatusBadge({ status }: { status: PersonStatus }) {
  return status === "settled" ? (
    <Badge variant="success">Settled</Badge>
  ) : (
    <Badge variant="outline">Active</Badge>
  );
}
