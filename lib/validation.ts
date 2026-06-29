import { z } from "zod";

const paymentMethod = z.enum(["cash", "upi", "bank", "cheque", "other"]);

export const personSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(80),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  reminderDate: z.string().optional().or(z.literal("")),
  reminderNotes: z.string().max(300).optional().or(z.literal("")),
  status: z.enum(["active", "settled"]).default("active"),
  profileImageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
export type PersonFormValues = z.input<typeof personSchema>;

export const transactionSchema = z.object({
  personId: z.string().min(1, "Select a person"),
  type: z.enum(["given", "received"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  method: paymentMethod,
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type TransactionFormValues = z.input<typeof transactionSchema>;

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  category: z.enum([
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
  ]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  method: paymentMethod,
  notes: z.string().max(500).optional().or(z.literal("")),
  receiptUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
export type ExpenseFormValues = z.input<typeof expenseSchema>;
