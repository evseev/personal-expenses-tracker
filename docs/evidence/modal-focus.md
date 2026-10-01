# Modal focus evidence

## Scope

This audit changes only the accepted expense form interaction. It does not change expense data, validation, persistence, or product scope.

## Applied guidance

- `AGENTS.md` rule 9 requires the modal form to keep keyboard focus inside, close with Escape, and restore focus to the opening button.
- The installed Vercel React Best Practices rule `rerender-move-effect-to-event` supports handling the interaction at the dialog boundary. The form uses a dialog `onKeyDown` handler for Tab and Escape, while the existing mount effect only performs initial amount focus.

## Regression coverage

`e2e/expenses.spec.ts` covers:

- forward Tab containment;
- reverse Shift+Tab containment;
- Escape dismissal; and
- focus restoration to the Add expense trigger; and
- fallback focus when editing moves a row outside the category filter.

The implementation also records the opener for edit actions and successful saves. If changing the category removes the edited row from a filtered list, focus moves to the stable Add expense button.

## Fresh verification

- `npm run lint` — exit 0.
- `npm run typecheck` — exit 0.
- `npm test` — 27 tests passed.
- `npm run fallow` — structural gate passed; the tool reported 7 quality findings for independent review and its audit verdict remained fail.
- `npm run build` — exit 0; static export and service worker generated.
- `npm run test:e2e` — 13 passed, 5 expected Chromium-only skips, 0 failures across Chromium and WebKit.
