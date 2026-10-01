import { describe, expect, it } from "vitest";
import { expensesForMonth, monthSummary, parseCents, parseExpenseDate } from "./expenses";
import type { Expense } from "./expenses";

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: "a",
  cents: 1250,
  date: "2026-10-01",
  category: "Food",
  note: "Lunch",
  createdAt: "2026-10-01T12:00:00.000Z",
  ...overrides,
});

describe("money input", () => {
  it.each([
    ["12.50", 1250],
    ["12,50", 1250],
    ["0.01", 1],
    [" 1 ", 100],
  ])("parses %s to integer cents", (input, expected) => {
    expect(parseCents(input)).toBe(expected);
  });

  it.each(["0", "-1", "1.999", "abc", "1,2.3", "1000000000000000"])(
    "rejects %s without creating a value",
    (input) => expect(() => parseCents(input)).toThrow(),
  );
});

describe("local dates and monthly totals", () => {
  it("rejects impossible calendar dates", () => {
    expect(() => parseExpenseDate("2026-02-30")).toThrow();
  });

  it("keeps a month boundary in the calendar month supplied", () => {
    const values = [expense({ id: "sep", date: "2026-09-30" }), expense({ id: "oct" })];
    expect(expensesForMonth(values, "2026-10").map((item) => item.id)).toEqual(["oct"]);
    expect(monthSummary(values, "2026-09").totalCents).toBe(1250);
  });

  it("sums each category and sorts newest expenses first", () => {
    const values = [
      expense({ id: "old", date: "2026-10-01", cents: 25 }),
      expense({ id: "new", date: "2026-10-03", cents: 175, category: "Home" }),
      expense({ id: "next", date: "2026-11-01", cents: 800 }),
    ];
    expect(expensesForMonth(values, "2026-10").map((item) => item.id)).toEqual(["new", "old"]);
    expect(monthSummary(values, "2026-10")).toMatchObject({
      totalCents: 200,
      byCategory: { Food: 25, Home: 175 },
    });
    expect(expensesForMonth(values, "2026-10", "Home").map((item) => item.id)).toEqual(["new"]);
  });
});
