# Production smoke evidence

The static PWA is deployed to `https://personal-expenses-tracker-eight.vercel.app/` on Vercel Hobby with Node.js 24. Vercel confirmed a ready production deployment. A fresh Chromium context accessed the HTTPS UI, manifest, and service worker, added a USD expense, reloaded immediately after the form closed, switched offline, and reloaded again. The corrected `npm run smoke:production` command passed twice on the deployed build.

The first smoke script used the note text as its save signal. That text was already present in the open form, so the script could reload before Save completed. The corrected script waits for the dialog to close and for the saved row's Edit button. This is a test race, not evidence of lost data. The storage adapter also now awaits `transaction.done` for put and delete, matching the product requirement that success follows a committed transaction.

The smoke command is reproducible:

```sh
PRODUCTION_URL=https://personal-expenses-tracker-eight.vercel.app npm run smoke:production
```

The command uses a new browser context; its expense data is discarded with that context. Browser data in a regular user profile remains local to that profile.
