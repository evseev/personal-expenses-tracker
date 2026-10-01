import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { evaluateFallow } from "./fallow-policy.mjs";

const typegen = spawnSync("node_modules/.bin/next", ["typegen"], { encoding: "utf8" });
if (typegen.status !== 0) {
  console.error(`Next.js route type generation failed: ${typegen.stderr || typegen.stdout}`);
  process.exit(1);
}

function runFallow(args) {
  const result = spawnSync("node_modules/.bin/fallow", [...args, "--format", "json", "--quiet"], { encoding: "utf8", maxBuffer: 8_000_000 });
  try {
    return JSON.parse(result.stdout);
  } catch {
    console.error(`Fallow returned invalid JSON for ${args[0]}: ${result.stderr || result.stdout}`);
    process.exit(1);
  }
}

const deadCode = runFallow(["dead-code"]);
const audit = runFallow(["audit", "--gate", "all"]);
const decision = evaluateFallow(deadCode, audit);
mkdirSync(".harness", { recursive: true });
writeFileSync(".harness/fallow-report.json", `${JSON.stringify({ decision, deadCode, audit }, null, 2)}\n`);
console.log(JSON.stringify(decision));
if (!decision.pass) {
  console.error("Fallow structural gate failed. Inspect .harness/fallow-report.json.");
  process.exitCode = 1;
} else if (decision.qualityFindings > 0 || decision.auditVerdict !== "pass") {
  console.log("Structural gate PASS. Quality findings require independent checker review; full report saved locally.");
}
