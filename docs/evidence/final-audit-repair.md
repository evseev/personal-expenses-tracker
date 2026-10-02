# Final audit and repair trace

The user authorized one final checker invocation after the original ten-hour runner window. The checkpoint kept its original `startedAt` and increased from 11 to 12 calls. GPT-6 Astra ran in a fresh read-only Codex CLI session against commit `56361cb`. It returned [`FAIL` with four actionable findings](final-audit-fail.json). The runner did not claim release readiness.

| Requirement | Checker finding | Regression and repair |
| --- | --- | --- |
| FR-3 / AC-6 | A failed write could leave an earlier success in `role=status`. | `clears a prior success when a later write fails` first failed, then passed after operation starts cleared stale status. |
| NFR-1 / AC-7 | The transparent import input had no visible focus. | `shows keyboard focus on Import JSON backup` first failed, then passed with a visible label outline on focus. |
| FR-4 | Service-worker readiness masked network connectivity. | The offline journey first failed its Online/Offline checks, then passed with separate indicators through disconnect and reconnect. |
| FR-6 | Demo records followed the selected month instead of the current local month. | `loads demo records into the current local month` first failed, then passed after sample dates and the selected view used the current local month. |

The four targeted browser tests failed on the pre-repair build and passed after the changes. A fresh `npm run verify` then exited 0: lint, TypeScript, 27 unit tests, Fallow structural gate, documentation links, static build, and 16 Playwright passes with 8 expected skips. Fallow's changeset audit reported five non-blocking complexity findings in `Dashboard.tsx`; the full structural scan found zero issues. The checker has **not** reviewed the repaired digest. Release remains pending a fresh independent audit, green CI for the repair commit, and production smoke for the new deployment.

The earlier local `verify` attempt failed only because its sandbox could not bind Playwright's localhost server (`EPERM`). The complete rerun with localhost permission passed. This environment failure is separate from the four real product findings.
