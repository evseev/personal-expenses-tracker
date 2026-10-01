import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const required = [
  "AGENTS.md", "ARCHITECTURE.md", "docs/product-specs/expenses-v1.md",
  "docs/design-docs/index.md", "docs/exec-plans/active/capstone.md",
  "docs/exec-plans/completed/index.md", "docs/exec-plans/tech-debt-tracker.md",
  "docs/generated/index.md", "docs/references/index.md", "docs/evidence/index.md",
  "docs/DESIGN.md", "docs/FRONTEND.md", "docs/PLANS.md", "docs/PRODUCT_SENSE.md",
  "docs/QUALITY_SCORE.md", "docs/RELIABILITY.md", "docs/SECURITY.md",
];
const problems = [];

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

for (const path of required) if (!existsSync(resolve(root, path))) problems.push(`Missing ${path}`);
for (const path of [resolve(root, "AGENTS.md"), resolve(root, "ARCHITECTURE.md"), ...markdownFiles(resolve(root, "docs"))]) {
  const contents = readFileSync(path, "utf8");
  for (const match of contents.matchAll(/\]\(([^)]+)\)/g)) {
    const link = match[1].split("#")[0];
    if (!link || /^(https?:|mailto:)/.test(link)) continue;
    if (!existsSync(resolve(dirname(path), link))) problems.push(`${path}: broken link ${link}`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Documentation map: ${required.length} required files and local links valid.`);
}
