# Quality score

Observed on the current local production build (`npm run verify`):

| Area | Evidence | Result |
| --- | --- | --- |
| Expense correctness | Domain and repository unit tests; Chromium/WebKit CRUD journey | Pass |
| Backup safety | Round-trip, invalid-import preservation, and storage-error tests | Pass |
| Offline availability | Chromium service-worker journey after first load | Pass |
| Keyboard accessibility | Chromium/WebKit modal focus, Escape, and filtered-edit fallback | Pass for tested flows |
| Harness integrity | Synthetic fault tests, real checker repair, and final audit FAIL trace | In progress until a fresh final checker PASS |

The current local release gate passes: 28 unit tests and 18 browser tests, with 10 expected WebKit skips for Chromium-only acceptance scenarios. Fallow's full-project structural gate passes. Its current changeset audit reports six complexity findings and a raw `fail` verdict; these are review debt, not an automatic structural failure. The Astra final checker found four product defects, and the Sol repeat checker verified those fixes but found one more demo-data risk. Each finding now has failing-before/passing-after regression coverage. The latest repair still needs an independent repeat audit.
