const MAX_CALLS = 24;
const MAX_MS = 10 * 60 * 60 * 1000;

export function budgetRemaining(state, now = Date.now()) {
  const calls = Math.max(0, MAX_CALLS - state.calls);
  const milliseconds = Math.max(0, MAX_MS - (now - Date.parse(state.startedAt)));
  return { calls, milliseconds, allowed: calls > 0 && milliseconds > 0 };
}

export function earnedPass(checks, checker, digest) {
  return checks.length > 0
    && checks.every((check) => check.exitCode === 0 && check.digest === digest)
    && checker?.status === "PASS"
    && checker.digest === digest
    && Array.isArray(checker.findings)
    && checker.findings.length === 0;
}

export function nextAttempt(state) {
  if (state.repairs < 2) return "repair";
  if (state.escalations < 2) return "escalate";
  return "stop";
}

export function buildAgentArgs({ root, model, effort, readOnly }) {
  const args = ["exec", "--ignore-user-config", "-C", root, "-m", model, "-c", `model_reasoning_effort="${effort}"`];
  if (readOnly) args.push("-s", "read-only");
  else args.push("--approve-for-me");
  return args;
}
