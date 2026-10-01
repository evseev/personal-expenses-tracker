import { z } from "zod";
import { CATEGORIES, parseExpenseDate } from "./expenses";
import type { Expense } from "./expenses";

const expenseSchema = z.strictObject({
  id: z.string().min(1).max(100),
  cents: z.number().int().positive().safe(),
  date: z.string().refine((date) => {
    try {
      parseExpenseDate(date);
      return true;
    } catch {
      return false;
    }
  }),
  category: z.enum(CATEGORIES),
  note: z.string().max(280),
  createdAt: z.iso.datetime(),
});

const backupSchema = z.strictObject({
  version: z.literal(1),
  expenses: z.array(expenseSchema).max(20_000),
});

export function serializeBackup(expenses: Expense[]): string {
  return JSON.stringify({ version: 1, expenses }, null, 2);
}

export function parseBackup(text: string): Expense[] {
  if (text.length > 5_000_000) throw new Error("Backup file is too large.");
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error("Select a valid JSON backup file.");
  }
  const parsed = backupSchema.safeParse(input);
  if (!parsed.success) throw new Error("This backup has an unsupported version or invalid expenses.");
  const ids = new Set(parsed.data.expenses.map((expense) => expense.id));
  if (ids.size !== parsed.data.expenses.length) throw new Error("Backup contains duplicate expense IDs.");
  return parsed.data.expenses;
}

export async function importBackup(repository: { replaceAll(expenses: Expense[]): Promise<void> }, text: string): Promise<number> {
  const expenses = parseBackup(text);
  await repository.replaceAll(expenses);
  return expenses.length;
}
