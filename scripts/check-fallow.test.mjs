import { describe, expect, it } from "vitest";
import { evaluateFallow } from "./fallow-policy.mjs";

describe("fallow gate policy", () => {
  const clean = { dead_code: { summary: { total_issues: 0, circular_dependencies: 0, boundary_violations: 0 } }, complexity: { findings: [] }, verdict: "pass" };

  it("requires zero dead code and architecture findings", () => {
    expect(evaluateFallow({ ...clean, dead_code: { summary: { total_issues: 1, circular_dependencies: 1 } } }).pass).toBe(false);
    expect(evaluateFallow({ ...clean, dead_code: { summary: { total_issues: 1, boundary_violations: 1 } } }).pass).toBe(false);
  });

  it("reports complexity for checker judgment without hiding the audit verdict", () => {
    const result = evaluateFallow({ ...clean, verdict: "fail", complexity: { findings: [{ name: "Dashboard" }] } });
    expect(result).toMatchObject({ pass: true, auditVerdict: "fail", qualityFindings: 1 });
  });

  it("rejects missing or malformed analysis", () => {
    expect(evaluateFallow({ error: true }).pass).toBe(false);
    expect(evaluateFallow({}).pass).toBe(false);
  });
});
