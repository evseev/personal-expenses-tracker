# Agent map

Read `docs/product-specs/expenses-v1.md` before changing product behavior. Read `ARCHITECTURE.md` before changing module boundaries. The repository is the source of truth; update it when behavior changes.

## Working rules

1. Change one accepted slice at a time. Read the active plan in `docs/exec-plans/active/`.
2. Keep money as integer USD cents and dates as local `YYYY-MM-DD` strings. UI code must use the repository interface rather than IndexedDB directly.
3. Add a meaningful failing test for behavior changes, then make it pass. Run `npm run verify` before release.
4. Never mark a gate PASS without a fresh exit code and artifact from the current code. State failures plainly.
5. Maker may edit product code. Checker reads the spec, diff, and check results without editing. Repair requires rechecking.
6. Do not weaken tests, acceptance criteria, or gate scripts to turn a failure green.
7. Use installed Vercel React Best Practices for relevant React decisions and ASD-STE100 for English agent instructions. Record applied rules in `docs/evidence/`.
8. Use `npm run fallow` for codebase analysis. Do not auto-fix fallow findings without inspection.
9. A modal form must keep keyboard focus inside it. Escape closes it. Closing it returns focus to the button that opened it. Add a browser regression test for this behavior.

## Knowledge map

- `ARCHITECTURE.md`: code boundaries and data flow.
- `docs/product-specs/`: requirements and acceptance criteria.
- `docs/design-docs/`: decisions and agent operating principles.
- `docs/exec-plans/`: active and completed work, debt.
- `docs/evidence/`: verification, reviews, and trace links.
- `docs/generated/`: generated references.
- `docs/references/`: external sources and skill provenance.
- `docs/PLANS.md`: how the autonomous loop works.
- `docs/QUALITY_SCORE.md`: current quality and known gaps.

The root-level `RTK.md` referenced in the initial environment was absent when this project was initialized. Do not invent its contents.
