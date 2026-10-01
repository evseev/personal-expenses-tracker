export const CATEGORIES = ["Food", "Transport", "Home", "Shopping", "Health", "Leisure", "Other"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  cents: number;
  date: string;
  category: Category;
  note: string;
  createdAt: string;
}

export function parseCents(value: string): number {
  const text = value.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) {
    throw new Error("Enter a positive amount with up to two decimal places.");
  }
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error("Enter a positive amount within the supported range.");
  }
  return cents;
}

export function parseExpenseDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Enter a valid calendar date.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid calendar date.");
  }
  return value;
}

export function currentLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function expensesForMonth(expenses: Expense[], month: string, category?: Category): Expense[] {
  return expenses
    .filter((expense) => expense.date.startsWith(`${month}-`) && (!category || expense.category === category))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function monthSummary(expenses: Expense[], month: string): {
  totalCents: number;
  byCategory: Record<Category, number>;
  count: number;
} {
  const byCategory = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>;
  let totalCents = 0;
  let count = 0;
  for (const expense of expenses) {
    if (!expense.date.startsWith(`${month}-`)) continue;
    totalCents += expense.cents;
    byCategory[expense.category] += expense.cents;
    count += 1;
  }
  return { totalCents, byCategory, count };
}
