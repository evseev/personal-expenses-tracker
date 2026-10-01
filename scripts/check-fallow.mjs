import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { evaluateFallow } from "./fallow-policy.mjs";

const result = spawnSync("node_modules/.bin/fallow", ["audit", "--gate", "all", "--format", "json", "--quiet"], { encoding: "utf8", maxBuffer: 8_000_000 });
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(`Fallow returned invalid JSON: ${result.stderr || result.stdout}`);
  process.exit(1);
}

const decision = evaluateFallow(report);
mkdirSync(".harness", { recursive: true });
writeFileSync(".harness/fallow-report.json", `${JSON.stringify({ decision, report }, null, 2)}\n`);
console.log(JSON.stringify(decision));
if (!decision.pass) {
  console.error("Fallow structural gate failed. Inspect .harness/fallow-report.json.");
  process.exitCode = 1;
} else if (decision.qualityFindings > 0 || decision.auditVerdict !== "pass") {
  console.log("Structural gate PASS. Quality findings require independent checker review; full report saved locally.");
}
