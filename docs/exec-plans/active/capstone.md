# Active execution plan

| Slice | Deliverable | Acceptance |
| --- | --- | --- |
| 1 Foundation | Spec, map, scaffold, CI, runner | Runner fault tests and one maker/checker smoke |
| 2 Expenses | Form, CRUD, IndexedDB | AC-1, AC-2, AC-3, AC-6 |
| 3 Overview | Month, categories, dark UI, demo | FR-2, FR-6, AC-7 |
| 4 Reliability | JSON backup, offline shell | AC-4, AC-5 |
| 5 Submission | Audit, CI, deployment, draft PR | AC-8 and evidence index |

Run slices sequentially. Each slice follows maker → checks → read-only checker → repair → fresh checks → commit. Stop after 24 model invocations or 10 wall-clock hours, whichever comes first. Allow at most two repair attempts per slice and two Astra escalations plus final audit. Preserve the checkpoint across restarts.

Human decisions: scope, UI language, USD, dark theme, local storage, no physical phone tests, and release package. Agents decide implementation details within these constraints and report evidence. The user records and submits the final video.
