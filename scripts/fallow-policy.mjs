export function evaluateFallow(deadCode, audit) {
  const summary = deadCode?.summary;
  const valid = deadCode && !deadCode.error && summary && Number.isInteger(summary.total_issues);
  const structuralIssues = valid ? summary.total_issues : null;
  return {
    pass: Boolean(valid && structuralIssues === 0),
    structuralIssues,
    auditVerdict: audit?.verdict ?? "missing",
    qualityFindings: Array.isArray(audit?.complexity?.findings) ? audit.complexity.findings.length : 0,
    hotspots: Array.isArray(audit?.complexity?.findings)
      ? audit.complexity.findings.map(({ path, name, cyclomatic, cognitive }) => ({ path, name, cyclomatic, cognitive }))
      : [],
  };
}
