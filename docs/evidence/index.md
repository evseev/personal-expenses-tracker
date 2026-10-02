# Evidence index

Evidence is collected during work. Each row must link a requirement, command result, independent review result, and commit. Never present a synthetic harness test as a real product defect.

| Practice | Artifact | Status |
| --- | --- | --- |
| SDD | `docs/product-specs/expenses-v1.md` | Spec commit `8d7cf39` precedes product commit `9849d9a` |
| Context engineering | `AGENTS.md` rule 9, `docs/evidence/modal-focus.md` | Rule commit `ff406c1` led to a browser regression and code change |
| Loop engineering | `docs/evidence/loop-run.md`, `scripts/harness.mjs` | Real maker, fresh gates, read-only checker, repair, and preserved call budget |
| Verification | `docs/evidence/modal-focus.md`, `docs/evidence/final-audit-repair.md`, `docs/evidence/final-audit-sol-repair.md` | Current local verify: 28 unit tests, 18 browser passes, 10 expected skips; fallow audit debt stated |
| Maker ≠ checker | `docs/evidence/checker-fail.json`, `docs/evidence/checker-pass.json` | Independent checker found missing focus fallback; regression added before repeat review |
| Vercel React skill | `docs/evidence/modal-focus.md` | Applied to modal event handling |
| ASD-STE100 skill | `docs/evidence/ste100-example.md` | One concrete before/after agent instruction |
| fallow | `docs/evidence/modal-focus.md` | Structural gate passed; 7 quality findings remain |
| Production delivery | `docs/evidence/production-smoke.md` | HTTPS PWA assets, persistence, and offline journey passed |
| Final audit | `docs/evidence/final-audit-fail.json`, `docs/evidence/final-audit-repair.md`, `docs/evidence/final-audit-sol-fail.json`, `docs/evidence/final-audit-sol-repair.md` | Four Astra findings fixed; Sol verified them and found one demo-data risk, now repaired and awaiting repeat review |
