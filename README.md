# Current — Personal Expenses Tracker

Current is a private expense tracker in USD. It runs as an installable Next.js PWA. The browser stores expenses in IndexedDB. After the production shell is ready, the app works without a network connection.

## Run locally

Use Node.js 24, as pinned in `.nvmrc` and used by CI and Vercel.

```sh
npm ci
npx playwright install chromium webkit
npm run dev
```

Open `http://localhost:3000`. The development server does not register the service worker. Use a production build to test offline behavior:

```sh
npm run build
npm run start
```

The app serves a static export from `out/`. It does not need a database server, account, environment variable, or external runtime asset. Browser data belongs to each browser profile. Use **Download JSON** to keep a backup before clearing site data.

## Verify

`npm run verify` runs lint, types, unit tests, fallow, documentation links, a production build, and desktop Playwright tests. Chromium covers CRUD, offline use, backup, errors, and an emulated mobile viewport. WebKit covers CRUD and modal keyboard behavior. The GitHub workflow uploads browser and fallow artifacts.

Fallow scans the full project for dead code, cycles, dependency, and boundary findings. Its incremental audit reports complexity and styling issues in the changeset for checker judgment. `npm run fallow` prints both the full structural result and the raw changeset audit verdict. A quality warning never becomes an invented Fallow pass.

## Agentic engineering evidence

- [Accepted product spec](docs/product-specs/expenses-v1.md) and [architecture](ARCHITECTURE.md)
- [Agent map](AGENTS.md) and [execution loop](docs/PLANS.md)
- [Evidence index](docs/evidence/index.md)
- [Skill provenance](docs/references/index.md)
- [Active execution plan](docs/exec-plans/active/capstone.md)

The repository keeps the maker and checker instructions in `harness/`. The runner uses Codex CLI and saves checkpoints in `.harness/state.json`. It limits model calls to 24 and elapsed time to 10 hours across resumes. Run `npm run harness -- --status` to inspect the checkpoint. Run `npm run harness` to execute remaining tasks and the final read-only audit. This command can consume Codex usage. It does not use an OpenAI API key.

## Submission

The [video script](docs/evidence/demo-script.md) covers the product and the agent workflow in under two minutes. The capstone draft PR should link the repository, deployment, CI, real demo video, and evidence index. The author adds their real name and video URL before submission.
