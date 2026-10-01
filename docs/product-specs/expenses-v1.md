# Personal Expenses Tracker v1

Status: accepted on 2026-10-01. Owner decisions: English UI, dark theme, USD, local-only data, desktop browser acceptance, one project in `v0-clean-agent`.

## User journey

A person opens the dashboard, adds an expense, sees its effect on the current month, edits it, switches the browser offline, adds another expense, reloads, and exports and restores a backup. The entire journey is available through the Web UI.

## Functional requirements

- **FR-1 Expenses:** Create, edit, and delete expenses. Delete needs confirmation. An expense has an ID, integer positive USD cents, local date (`YYYY-MM-DD`), one fixed category, and an optional note. The form accepts a dot or comma decimal separator and up to two decimal places.
- **FR-2 Monthly view:** Select a month. Display its total, category totals as horizontal bars, and expenses newest first. Filter the list by category. Editing or deleting a record immediately updates the view.
- **FR-3 Persistence:** Store data in IndexedDB. Reloading the page preserves records. A failed write reports an error and never displays success.
- **FR-4 Offline PWA:** Provide a manifest and installable production app. Once the service worker controls the page, the main route and bundled assets load offline. Creating, editing, and deleting expenses remain usable offline. Show offline readiness separately from network connectivity.
- **FR-5 Backup:** Export a versioned JSON document containing all expenses. Validate an imported document fully, including unique IDs, before asking to replace data. Replace records in one transaction. Invalid imports leave existing data unchanged.
- **FR-6 Demo:** In an empty database only, a user can load deterministic sample expenses for the current month. The user can also export or delete these expenses normally.

## Non-functional requirements

- **NFR-1:** English UI, dark theme, accessible contrast, labelled controls, keyboard operation, responsive desktop and emulated mobile layouts.
- **NFR-2:** All financial values use integer cents. All month logic uses local calendar strings; UTC conversion must not move an expense into another day.
- **NFR-3:** No login, network data API, third-party runtime assets, analytics, or secrets in the client.
- **NFR-4:** Errors are visible. Tests and gates must report failures truthfully.

## Acceptance checks

- **AC-1:** Create `$12.50`, edit to `$13.25`, delete after confirmation; monthly total changes each time.
- **AC-2:** A record on the final day of one month never enters the next month, regardless of time zone. Invalid or zero amounts are rejected.
- **AC-3:** Reload the page and retain expense data.
- **AC-4:** Wait for offline readiness, disconnect desktop Chromium, reload, and create an expense.
- **AC-5:** Export and restore JSON; invalid JSON and duplicate IDs leave stored data intact.
- **AC-6:** A storage error shows an error and no success message.
- **AC-7:** Verify keyboard navigation, labels, contrast, desktop Chromium/WebKit smoke, and mobile viewport emulation in desktop browser.
- **AC-8:** On HTTPS deployment, fetch the page, manifest, icons, and service worker successfully.

## Exclusions

Accounts, sync, OCR, bank integrations, budgets, recurring expenses, multiple currencies, AI features in the app, and tests on physical phones.
