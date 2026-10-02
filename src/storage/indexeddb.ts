import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { Expense } from "../domain/expenses";
import type { ExpenseRepository } from "./repository";

const STORE = "expenses";

export class IndexedDbExpenseRepository implements ExpenseRepository {
  constructor(private readonly name = "personal-expenses-v1") {}

  private async open(): Promise<IDBPDatabase> {
    return openDB(this.name, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
      },
    });
  }

  async list(): Promise<Expense[]> {
    const database = await this.open();
    try {
      return (await database.getAll(STORE)) as Expense[];
    } finally {
      database.close();
    }
  }

  async put(expense: Expense): Promise<void> {
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE, "readwrite");
      await transaction.store.put(expense);
      await transaction.done;
    } finally {
      database.close();
    }
  }

  async remove(id: string): Promise<void> {
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE, "readwrite");
      await transaction.store.delete(id);
      await transaction.done;
    } finally {
      database.close();
    }
  }

  async replaceAll(expenses: Expense[]): Promise<void> {
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE, "readwrite");
      await transaction.store.clear();
      for (const expense of expenses) await transaction.store.put(expense);
      await transaction.done;
    } finally {
      database.close();
    }
  }

  async insertIfEmpty(expenses: Expense[]): Promise<boolean> {
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE, "readwrite");
      if (await transaction.store.count() !== 0) {
        await transaction.done;
        return false;
      }
      for (const expense of expenses) await transaction.store.add(expense);
      await transaction.done;
      return true;
    } finally {
      database.close();
    }
  }
}
