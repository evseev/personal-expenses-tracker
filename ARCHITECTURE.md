# Architecture

The app is a single-user, browser-local Next.js static export. The browser downloads a versioned application shell and stores expense data in IndexedDB. There is no application server or HTTP API.

```
Next.js page / React components
             ↓
expense service and pure domain functions
             ↓
ExpenseRepository interface
             ↓
IndexedDB adapter (idb)
```

The domain owns money parsing, local calendar dates, category totals, ordering, and backup validation. React components do not read IndexedDB directly. The IndexedDB adapter owns transactions. A backup restore validates the entire payload before one write transaction replaces the existing records.

The build statically exports the page. Workbox generates a precaching service worker from the exported files. The app registers that worker only in a production browser. Offline readiness means the worker has installed and controls the page; `navigator.onLine` alone is not proof. The application does not fetch remote fonts, images, or APIs.

The service worker caches application files only. Expense data stays in IndexedDB and is never sent to deployment infrastructure. Clearing site data deletes expenses; JSON export provides a portable backup.
