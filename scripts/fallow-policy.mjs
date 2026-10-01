export function evaluateFallow(report) {
  const summary = report?.dead_code?.summary;
  const valid = report && !report.error && summary && Number.isInteger(summary.total_issues);
  const structuralIssues = valid ? summary.total_issues : null;
  return {
    pass: Boolean(valid && structuralIssues === 0),
    structuralIssues,
    auditVerdict: report?.verdict ?? "missing",
    qualityFindings: Array.isArray(report?.complexity?.findings) ? report.complexity.findings.length : 0,
    hotspots: Array.isArray(report?.complexity?.findings)
      ? report.complexity.findings.map(({ path, name, cyclomatic, cognitive }) => ({ path, name, cyclomatic, cognitive }))
      : [],
  };
}
