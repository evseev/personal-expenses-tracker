import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import { IndexedDbExpenseRepository } from "./indexeddb";
import { importBackup } from "../domain/backup";
import type { Expense } from "../domain/expenses";

const name = "expenses-test";
const sample: Expense = {
  id: "saved",
  cents: 1099,
  date: "2026-10-01",
  category: "Food",
  note: "Coffee",
  createdAt: "2026-10-01T12:00:00.000Z",
};

afterEach(async () => deleteDB(name));

describe("IndexedDB expense repository", () => {
  it("persists create, edit, and delete across repository instances", async () => {
    const first = new IndexedDbExpenseRepository(name);
    await first.put(sample);
    const second = new IndexedDbExpenseRepository(name);
    expect(await second.list()).toEqual([sample]);
    await second.put({ ...sample, cents: 1325 });
    expect((await first.list())[0]?.cents).toBe(1325);
    await first.remove(sample.id);
    expect(await second.list()).toEqual([]);
  });

  it("leaves stored data intact if imported JSON fails validation", async () => {
    const repository = new IndexedDbExpenseRepository(name);
    await repository.put(sample);
    await expect(importBackup(repository, JSON.stringify({ version: 1, expenses: [sample, sample] }))).rejects.toThrow();
    expect(await repository.list()).toEqual([sample]);
  });

  it("replaces all records after a valid import", async () => {
    const repository = new IndexedDbExpenseRepository(name);
    await repository.put(sample);
    const replacement = { ...sample, id: "new", cents: 2500 };
    await importBackup(repository, JSON.stringify({ version: 1, expenses: [replacement] }));
    expect(await repository.list()).toEqual([replacement]);
  });

  it("adds demo records only when the stored data is empty", async () => {
    const repository = new IndexedDbExpenseRepository(name);
    expect(await repository.insertIfEmpty([sample])).toBe(true);
    const replacement = { ...sample, id: "demo", note: "Demo" };
    expect(await repository.insertIfEmpty([replacement])).toBe(false);
    expect(await repository.list()).toEqual([sample]);
  });
});
