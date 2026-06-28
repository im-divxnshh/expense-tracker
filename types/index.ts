// Core domain types for the Personal Expense & Money Ledger.

export type ID = string;

/** ISO date string (yyyy-MM-dd or full ISO). */
export type ISODate = string;

export type PaymentMethod = "cash" | "upi" | "bank" | "cheque" | "other";

export type ExpenseCategory =
  | "Food"
  | "Fuel"
  | "Shopping"
  | "Office"
  | "Salary"
  | "Rent"
  | "Bills"
  | "Travel"
  | "Medical"
  | "Entertainment"
  | "Investment"
  | "Other";

export type TransactionType = "given" | "received";

export type PersonStatus = "active" | "settled";

/** Fields automatically attached to every stored document. */
export interface BaseDoc {
  id: ID;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface Person extends BaseDoc {
  fullName: string;
  phone?: string;
  address?: string;
  notes?: string;
  /** Date by which the person is expected to settle. */
  dueDate?: ISODate | null;
  /** Date to be reminded about this person. */
  reminderDate?: ISODate | null;
  reminderNotes?: string;
  status: PersonStatus;
  profileImageUrl?: string;
}

export interface Transaction extends BaseDoc {
  personId: ID;
  type: TransactionType;
  amount: number;
  date: ISODate;
  method: PaymentMethod;
  notes?: string;
}

export interface Expense extends BaseDoc {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: ISODate;
  method: PaymentMethod;
  notes?: string;
  /** Optional external receipt image URL (no upload — Storage not used). */
  receiptUrl?: string;
}

export interface Settings {
  id: "settings";
  ownerName: string;
  businessName?: string;
  currency: string; // ISO currency code, e.g. "INR"
  updatedAt: number;
}

export type CollectionName =
  | "people"
  | "transactions"
  | "expenses"
  | "settings";

/** A person with derived ledger figures attached. */
export interface PersonWithBalance extends Person {
  totalGiven: number;
  totalReceived: number;
  pending: number; // given - received
  lastTransactionDate: ISODate | null;
  transactionCount: number;
}

export type ReminderBucket = "overdue" | "today" | "tomorrow" | "upcoming";

export interface ReminderItem {
  person: PersonWithBalance;
  dueDate: ISODate;
  bucket: ReminderBucket;
  daysDiff: number;
}
