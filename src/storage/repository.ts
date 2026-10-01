import type { Expense } from "../domain/expenses";

export interface ExpenseRepository {
  list(): Promise<Expense[]>;
  put(expense: Expense): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(expenses: Expense[]): Promise<void>;
}
