# Quality score

Observed on the current local production build (`npm run verify`):

| Area | Evidence | Result |
| --- | --- | --- |
| Expense correctness | Domain and repository unit tests; Chromium/WebKit CRUD journey | Pass |
| Backup safety | Round-trip, invalid-import preservation, and storage-error tests | Pass |
| Offline availability | Chromium service-worker journey after first load | Pass |
| Keyboard accessibility | Chromium/WebKit modal focus, Escape, and filtered-edit fallback | Pass for tested flows |
| Harness integrity | Synthetic fault tests, real checker repair, and final audit FAIL trace | In progress until a fresh final checker PASS |

The current local release gate passes: 27 unit tests and 16 browser tests, with 8 expected WebKit skips for Chromium-only acceptance scenarios. Fallow's full-project structural gate passes. Its current changeset audit reports five complexity findings and a raw `fail` verdict; these are review debt, not an automatic structural failure. The final checker found four product defects in the previous commit. All four now have failing-before/passing-after browser regressions, but the repaired code still needs an independent repeat audit.
