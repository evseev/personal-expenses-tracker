# Bounded maker/checker run

The [runner](../../scripts/harness.mjs) consumed the accepted [accessibility task](../../harness/tasks/01-audit-accessibility.md). It used a persisted 24-call/10-hour budget and one active Codex CLI agent at a time. The checkpoint reached 11 counted model invocations and one started Astra escalation. The user paused that escalation; the runner preserved the count. No paid API key was used.

The planned GPT-6 Luna model was unavailable to this ChatGPT account through the installed CLI. The older CLI could not start GPT-6 Astra. We pinned a newer CLI and used available GPT-5.6 Luna for maker/checker. These failures remain in the local checkpoint and were not counted as successes.

| Event | Evidence | Consequence |
| --- | --- | --- |
| Rule 9 added | [AGENTS.md](../../AGENTS.md), commit `ff406c1` | The maker added modal keyboard handling and a browser test. |
| Deterministic checks | [gate report](01-audit-accessibility.md) | Lint, types, tests, fallow structural gate, docs, build, and browser tests passed for the reviewed digest. |
| Independent review failed | [checker FAIL JSON](checker-fail.json) | It found that a filtered edit could remove the opener from the DOM and leave focus without a target. It also found stale evidence counts. |
| Repair and repeated checks | [regression test](../../e2e/expenses.spec.ts), [UI fix](../../src/components/Dashboard.tsx) | The fallback moves focus to the stable Add expense button. The evidence counts now match the run. |
| Independent review passed | [checker PASS JSON](checker-pass.json), commit `467a835` | The report has `status: PASS` and an empty findings array. The runner committed only after fresh checks for the same digest. |

The first checker responses said `PASS` but put non-blocking notes in `findings`. The gate rejected them. We clarified the checker contract and added review-only resume, so already verified code did not require another maker run. The later checker found an actual defect. This trace distinguishes a report-format issue from a product defect.

The [local production smoke](production-smoke.md) and GitHub CI run are separate release gates. The ignored `.harness/runs/` directory holds full local logs; these compact checker reports and [fault tests](../../scripts/harness-core.test.mjs) are committed for review.

After the original ten-hour window elapsed, the user authorized one more final audit call without resetting the checkpoint. Call 12 used GPT-6 Astra in a fresh read-only session and returned four product findings. The [compact report](final-audit-fail.json) and [repair trace](final-audit-repair.md) preserve the FAIL and the subsequent test-first fixes. A second final checker call requires a separate authorization; the runner remains blocked rather than changing its original budget policy.
