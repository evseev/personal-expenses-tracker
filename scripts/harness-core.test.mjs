import { describe, expect, it } from "vitest";
import { budgetRemaining, earnedPass, nextAttempt } from "./harness-core.mjs";

describe("synthetic harness fault cases", () => {
  const startedAt = "2026-10-01T10:00:00.000Z";

  it("keeps the used invocation budget across a resume", () => {
    const persisted = { startedAt, calls: 23 };
    expect(budgetRemaining(persisted, Date.parse(startedAt) + 1000).calls).toBe(1);
    expect(budgetRemaining({ ...persisted, calls: 24 }, Date.parse(startedAt) + 1000).allowed).toBe(false);
  });

  it("stops when the ten-hour wall clock expires", () => {
    expect(budgetRemaining({ startedAt, calls: 2 }, Date.parse(startedAt) + 10 * 60 * 60 * 1000).allowed).toBe(false);
  });

  it("never earns PASS from failed, missing, or stale evidence", () => {
    const report = { status: "PASS", digest: "current", findings: [] };
    expect(earnedPass([], report, "current")).toBe(false);
    expect(earnedPass([{ name: "test", exitCode: 1 }], report, "current")).toBe(false);
    expect(earnedPass([{ name: "test", exitCode: 0, digest: "old" }], report, "current")).toBe(false);
    expect(earnedPass([{ name: "test", exitCode: 0, digest: "current" }], { ...report, digest: "old" }, "current")).toBe(false);
    expect(earnedPass([{ name: "test", exitCode: 0, digest: "current" }], report, "current")).toBe(true);
  });

  it("limits repair turns to two and records escalation separately", () => {
    expect(nextAttempt({ repairs: 0, escalations: 0 })).toBe("repair");
    expect(nextAttempt({ repairs: 2, escalations: 0 })).toBe("escalate");
    expect(nextAttempt({ repairs: 2, escalations: 2 })).toBe("stop");
  });
});
