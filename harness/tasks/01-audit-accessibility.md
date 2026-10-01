# Audit and improve the accepted product

Read `docs/product-specs/expenses-v1.md`, `ARCHITECTURE.md`, rule 9 in `AGENTS.md`, and the installed Vercel React Best Practices skill. The current form puts initial focus inside the modal but does not contain Tab focus or restore focus to the trigger. Add a failing Playwright regression test for Tab containment, Escape, and focus restoration. Fix the form. Keep the product scope fixed. Run relevant checks. Report how rule 9 changed the implementation. The independent checker must verify the fix and all accepted checks.
