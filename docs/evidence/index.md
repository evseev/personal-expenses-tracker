# Evidence index

Evidence is collected during work. Each row must link a requirement, command result, independent review result, and commit. Never present a synthetic harness test as a real product defect.

| Practice | Artifact | Status |
| --- | --- | --- |
| SDD | `docs/product-specs/expenses-v1.md` | Spec commit `8d7cf39` precedes product commit `9849d9a` |
| Context engineering | `AGENTS.md` rule 9, `docs/evidence/modal-focus.md` | Rule commit `ff406c1` led to a browser regression and code change |
| Loop engineering | `scripts/harness.mjs`, `.harness/state.json` | Real maker, fresh gates, read-only checker, repair, and preserved call budget; final result recorded by runner |
| Verification | `docs/evidence/modal-focus.md` | Full verify: 27 unit tests, 13 browser passes, 5 expected skips; fallow audit failure stated |
| Maker ≠ checker | `docs/evidence/modal-focus.md` | Independent checker found missing focus fallback; regression added before repeat review |
| Vercel React skill | `docs/evidence/modal-focus.md` | Applied to modal event handling |
| ASD-STE100 skill | `docs/evidence/ste100-example.md` | One concrete before/after agent instruction |
| fallow | `docs/evidence/modal-focus.md` | Structural gate passed; 7 quality findings remain |
| Production delivery | `docs/evidence/production-smoke.md` | HTTPS PWA assets, persistence, and offline journey passed |
