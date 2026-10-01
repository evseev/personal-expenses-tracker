#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { budgetRemaining, buildAgentArgs, earnedPass, nextAttempt } from "./harness-core.mjs";

const root = process.cwd();
const store = resolve(root, ".harness");
const stateFile = join(store, "state.json");
const lockFile = join(store, "lock.json");
const runDir = join(store, "runs");
const tasksDir = resolve(root, "harness/tasks");
const schema = resolve(root, "harness/checker.schema.json");
const checkCommands = ["npm run lint", "npm run typecheck", "npm test", "npm run fallow", "npm run check:docs", "npm run build", "npm run test:e2e"];

mkdirSync(runDir, { recursive: true });

function save(state) {
  const temp = `${stateFile}.tmp`;
  writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(temp, stateFile);
}

function load() {
  if (existsSync(stateFile)) return JSON.parse(readFileSync(stateFile, "utf8"));
  const state = { startedAt: new Date().toISOString(), calls: 0, escalations: 0, completed: [], events: [], status: "RUNNING" };
  save(state);
  return state;
}

function acquireLock() {
  if (existsSync(lockFile)) {
    const lock = JSON.parse(readFileSync(lockFile, "utf8"));
    try { process.kill(lock.pid, 0); } catch { rmSync(lockFile); }
    if (existsSync(lockFile)) throw new Error(`Another harness process (${lock.pid}) owns the lock.`);
  }
  const fd = openSync(lockFile, "wx");
  writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  return () => rmSync(lockFile, { force: true });
}

function digestRepo() {
  const paths = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root })
    .toString("utf8").split("\0").filter(Boolean).sort();
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(root, path)));
  }
  return hash.digest("hex");
}

function record(state, event) {
  state.events.push({ at: new Date().toISOString(), ...event });
  save(state);
}

async function run(argv, logName, timeoutMs = 20 * 60_000) {
  const logPath = join(runDir, logName);
  let output = "";
  return new Promise((resolveRun) => {
    const child = spawn(argv[0], argv.slice(1), { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); }, timeoutMs);
    const append = (chunk) => { output += chunk.toString(); if (output.length > 1_000_000) output = output.slice(-1_000_000); };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", (error) => append(Buffer.from(error.message)));
    child.on("close", (code) => {
      clearTimeout(timer);
      writeFileSync(logPath, output);
      resolveRun({ exitCode: timedOut ? 124 : code ?? 1, logPath, tail: output.slice(-2500) });
    });
  });
}

async function agent(state, role, prompt, model, effort, label, readOnly = false) {
  if (!budgetRemaining(state).allowed) throw new Error("Autonomous run budget exhausted.");
  state.calls += 1;
  record(state, { kind: "AGENT_START", role, model, label, call: state.calls });
  const outputFile = join(runDir, `${label}-answer.json`);
  const argv = [process.env.CAPSTONE_CODEX_BIN || "codex", ...buildAgentArgs({ root, model, effort, readOnly })];
  if (readOnly) argv.push("--output-schema", schema);
  argv.push("--json", "-o", outputFile, prompt);
  const result = await run(argv, `${label}.jsonl`, 30 * 60_000);
  record(state, { kind: "AGENT_END", role, model, label, exitCode: result.exitCode, logPath: result.logPath });
  return { ...result, outputFile };
}

async function checks(state, label) {
  const reports = [];
  for (let index = 0; index < checkCommands.length; index += 1) {
    const name = checkCommands[index];
    const [binary, ...args] = name.split(" ");
    const result = await run([binary, ...args], `${label}-check-${index}.log`, 7 * 60_000);
    const report = { name, exitCode: result.exitCode, digest: digestRepo(), logPath: result.logPath, tail: result.tail };
    reports.push(report);
    record(state, { kind: "CHECK", name, exitCode: report.exitCode, digest: report.digest, logPath: report.logPath });
    if (report.exitCode !== 0) break;
  }
  return reports;
}

function checkerPrompt(task, digest, reports) {
  return [
    "You are the independent checker. Read AGENTS.md, the accepted spec, and the task.",
    "Do not edit files. Inspect the current git diff and product code.",
    "Review correctness, acceptance, accessibility, security, and the Vercel React skill rules that apply.",
    "Return PASS only if the evidence proves the task. Report actionable findings otherwise.",
    `Task: ${task}`,
    `Current repository digest: ${digest}`,
    `Fresh checks: ${JSON.stringify(reports.map(({ name, exitCode, tail }) => ({ name, exitCode, tail: tail.slice(-500) })))}`,
    "Your JSON digest must equal the supplied digest. Status is PASS, FAIL, or BLOCKED.",
  ].join("\n");
}

async function completeTask(state, file) {
  const task = readFileSync(join(tasksDir, file), "utf8");
  let repairs = 0;
  let feedback = "";
  for (;;) {
    if (!budgetRemaining(state).allowed) throw new Error("Autonomous run budget exhausted.");
    const attempt = repairs + 1;
    const label = `${basename(file, ".md")}-${String(state.calls + 1).padStart(2, "0")}`;
    const escalated = repairs > 2;
    const model = escalated ? "gpt-6-astra" : "gpt-6-luna";
    const effort = escalated ? "high" : "medium";
    if (escalated) { state.escalations += 1; save(state); }
    const maker = await agent(state, "maker", `Read AGENTS.md and the task. Implement and test it. Do not weaken gates.\nTask:\n${task}\nFeedback:\n${feedback}`, model, effort, label);
    if (maker.exitCode !== 0) throw new Error(`Maker failed. See ${maker.logPath}`);
    const reports = await checks(state, label);
    const digest = digestRepo();
    let checker = null;
    if (reports.length === checkCommands.length && reports.every((check) => check.exitCode === 0 && check.digest === digest)) {
      const reviewed = await agent(state, "checker", checkerPrompt(task, digest, reports), "gpt-6-luna", "high", `${label}-review`, true);
      if (reviewed.exitCode !== 0) throw new Error(`Checker failed. See ${reviewed.logPath}`);
      try { checker = JSON.parse(readFileSync(reviewed.outputFile, "utf8")); } catch { throw new Error("Checker did not write valid JSON."); }
      if (digestRepo() !== digest) throw new Error("Repository changed during read-only review.");
    }
    if (earnedPass(reports, checker, digest)) {
      const evidencePath = resolve(root, `docs/evidence/${basename(file, ".md")}.md`);
      const relativeLogPaths = reports.map((report) => `${report.name}: exit ${report.exitCode}`).join("\n");
      writeFileSync(evidencePath, `# ${file} evidence\n\n- Task: \`harness/tasks/${file}\`\n- Source digest at review: \`${digest}\`\n- Model calls used: ${state.calls}\n- Checker: PASS; no findings\n\n## Deterministic checks\n\n${relativeLogPaths}\n\nFull local logs: \`.harness/runs/\`. CI stores its independent verification logs.\n`);
      execFileSync("git", ["add", "-A"], { cwd: root });
      const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: root, encoding: "utf8" });
      if (staged.trim()) execFileSync("git", ["commit", "-m", `feat: complete ${basename(file, ".md").replaceAll("-", " ")}`], { cwd: root });
      state.completed.push(file);
      record(state, { kind: "TASK_PASS", task: file, digest, attempt, checker });
      console.log(`PASS ${file}`);
      return;
    }
    feedback = reports.find((report) => report.exitCode !== 0)?.tail ?? JSON.stringify(checker?.findings ?? ["Missing fresh check evidence"]);
    const next = nextAttempt({ repairs, escalations: state.escalations });
    record(state, { kind: "TASK_NOT_EARNED", task: file, attempt, next, feedback: feedback.slice(-1000) });
    if (next === "stop") throw new Error(`Task ${file} did not earn PASS. ${feedback.slice(-350)}`);
    if (next === "repair") repairs += 1;
    else repairs = 3;
  }
}

async function main() {
  if (process.argv.includes("--status")) {
    console.log(existsSync(stateFile) ? readFileSync(stateFile, "utf8") : "No autonomous run has started.");
    return;
  }
  const unlock = acquireLock();
  try {
    const state = load();
    const files = readdirSync(tasksDir).filter((file) => file.endsWith(".md")).sort();
    for (const file of files) if (!state.completed.includes(file)) await completeTask(state, file);
    if (!state.finalAudit) {
      const digest = digestRepo();
      const result = await agent(state, "final-checker", `Read AGENTS.md and docs/product-specs/expenses-v1.md. Review the completed product and evidence without editing. Return JSON PASS only if all acceptance criteria are supported. Digest: ${digest}`, "gpt-6-astra", "high", "final-audit", true);
      if (result.exitCode !== 0) throw new Error(`Final audit failed. See ${result.logPath}`);
      const audit = JSON.parse(readFileSync(result.outputFile, "utf8"));
      if (audit.status !== "PASS" || audit.digest !== digest || digestRepo() !== digest) throw new Error("Final audit did not earn PASS.");
      state.finalAudit = audit;
    }
    state.status = "COMPLETE";
    save(state);
    console.log("COMPLETE: all tasks and final audit passed.");
  } catch (error) {
    const state = load();
    state.status = "BLOCKED";
    state.blocker = error instanceof Error ? error.message : String(error);
    save(state);
    console.error(`BLOCKED: ${state.blocker}`);
    process.exitCode = 1;
  } finally {
    unlock();
  }
}

await main();
