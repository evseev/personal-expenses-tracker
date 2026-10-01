import { describe, expect, it } from "vitest";
import { evaluateFallow } from "./fallow-policy.mjs";

describe("fallow gate policy", () => {
  const clean = { summary: { total_issues: 0, circular_dependencies: 0, boundary_violations: 0 } };
  const audit = { complexity: { findings: [] }, verdict: "pass" };

  it("requires zero dead code and architecture findings", () => {
    expect(evaluateFallow({ summary: { total_issues: 1, circular_dependencies: 1 } }, audit).pass).toBe(false);
    expect(evaluateFallow({ summary: { total_issues: 1, boundary_violations: 1 } }, audit).pass).toBe(false);
  });

  it("reports complexity for checker judgment without hiding the audit verdict", () => {
    const result = evaluateFallow(clean, { verdict: "fail", complexity: { findings: [{ name: "Dashboard" }] } });
    expect(result).toMatchObject({ pass: true, auditVerdict: "fail", qualityFindings: 1 });
  });

  it("rejects missing or malformed analysis", () => {
    expect(evaluateFallow({ error: true }, audit).pass).toBe(false);
    expect(evaluateFallow({}, audit).pass).toBe(false);
    expect(evaluateFallow(clean, { verdict: "pass" }).pass).toBe(true);
  });
});
