import { describe, expect, it } from "vitest";
import { parseBackup, serializeBackup } from "./backup";
import type { Expense } from "./expenses";

const sample: Expense = {
  id: "item-1",
  cents: 1050,
  date: "2026-10-01",
  category: "Food",
  note: "Tea",
  createdAt: "2026-10-01T10:00:00.000Z",
};

describe("portable backups", () => {
  it("round-trips records using a versioned document", () => {
    expect(parseBackup(serializeBackup([sample]))).toEqual([sample]);
  });

  it("rejects duplicate IDs and invalid records", () => {
    expect(() => parseBackup(JSON.stringify({ version: 1, expenses: [sample, sample] }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ version: 1, expenses: [{ ...sample, cents: -1 }] }))).toThrow();
  });

  it("rejects unsupported versions and oversized input", () => {
    expect(() => parseBackup(JSON.stringify({ version: 2, expenses: [] }))).toThrow();
    expect(() => parseBackup("x".repeat(5_000_001))).toThrow();
  });
});
