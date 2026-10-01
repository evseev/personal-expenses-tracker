# Quality score

Observed on the current local production build (`npm run verify`):

| Area | Evidence | Result |
| --- | --- | --- |
| Expense correctness | Domain and repository unit tests; Chromium/WebKit CRUD journey | Pass |
| Backup safety | Round-trip, invalid-import preservation, and storage-error tests | Pass |
| Offline availability | Chromium service-worker journey after first load | Pass |
| Keyboard accessibility | Chromium/WebKit modal focus, Escape, and filtered-edit fallback | Pass for tested flows |
| Harness integrity | Synthetic fault tests and real independent checker finding | In progress until final checker PASS |

Fallow's structural gate passes. Its raw audit remains `fail` because it reports seven complexity findings. These are recorded for checker judgment and follow-up in `docs/exec-plans/tech-debt-tracker.md`.
