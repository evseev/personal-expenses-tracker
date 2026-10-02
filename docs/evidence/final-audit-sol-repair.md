# GPT-6 Sol repeat audit and repair

The user authorized a second read-only final checker invocation using GPT-6 Sol. The original checkpoint retained its start time and previous Astra `FAIL`; this was call 13. [The Sol report](final-audit-sol-fail.json) verified all four earlier fixes but found one new FR-6 data-loss risk: after an initial IndexedDB read error, the dashboard could offer demo data and `replaceAll` could erase existing records.

The repair changes demo loading in two places. The UI offers samples only after a successful empty read. The repository adds samples with `insertIfEmpty`: one IndexedDB readwrite transaction counts stored records and adds samples only when the count is zero. A nonempty store returns `false` without deleting any record; the UI refreshes its view and explains why samples were not added. JSON backup restore still uses its separately confirmed atomic replacement path.

Evidence was collected in test-first order:

1. The new repository test and two browser tests failed on the pre-repair code. The browser scenarios cover existing data with a failed initial read and a record added after the empty view loaded.
2. The targeted unit and browser tests passed after the repair.
3. A fresh `npm run verify` exited 0: lint, TypeScript, 28 unit tests, Fallow structural gate, documentation links, static build, and 18 Playwright passes with 10 expected skips. Fallow's changeset audit reported six non-blocking complexity findings; the full structural scan found zero issues.

The Sol report remains `FAIL` for its original digest. No later checker PASS is implied by these deterministic checks.
