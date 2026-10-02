# Technical debt

Fallow reported seven complexity hotspots in an earlier changeset across `scripts/harness.mjs` and `src/components/Dashboard.tsx`. The current repair changeset reports five hotspots in `Dashboard.tsx`. The full structural checks for unused code, cycles, dependencies, and module boundaries pass. The current acceptance flows have unit and browser coverage, so these hotspots are review debt rather than an automatic release blocker. A later refactor can split the dashboard and runner without changing behavior; rerun `npm run verify` and compare the Fallow JSON report afterward.
