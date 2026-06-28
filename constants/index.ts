import type { ExpenseCategory, PaymentMethod } from "@/types";

export const APP_NAME = "Ledgerly";
export const OWNER_NAME = "Harsh Rastogi";
export const DEFAULT_CURRENCY = "INR";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> =
  PAYMENT_METHODS.reduce(
    (acc, m) => ({ ...acc, [m.value]: m.label }),
    {} as Record<PaymentMethod, string>,
  );

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Fuel",
  "Shopping",
  "Office",
  "Salary",
  "Rent",
  "Bills",
  "Travel",
  "Medical",
  "Entertainment",
  "Investment",
  "Other",
];

/** Stable colors per category for charts and badges. */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: "#f97316",
  Fuel: "#ef4444",
  Shopping: "#ec4899",
  Office: "#8b5cf6",
  Salary: "#22c55e",
  Rent: "#0ea5e9",
  Bills: "#eab308",
  Travel: "#14b8a6",
  Medical: "#f43f5e",
  Entertainment: "#a855f7",
  Investment: "#10b981",
  Other: "#64748b",
};

/** Chart palette used for generic series. */
export const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#0ea5e9",
  "#eab308",
  "#14b8a6",
  "#a855f7",
];
