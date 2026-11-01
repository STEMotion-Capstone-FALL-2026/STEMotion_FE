# Browser end-to-end tests (Playwright)

One spec per main workflow of the Design Brief (A1) and BM04, each walking its demo scenarios:

| Spec | Workflow | Owner | Status |
|---|---|---|---|
| `wf01-team-setup.spec.ts` | WF-01 Team setup and onboarding (DS-01a, DS-01b) | Phan Phước Long Trì | done |
| `wf02-script.spec.ts` | WF-02 Script authoring and approval (DS-02a, DS-02b) | Nguyễn Việt Hoàng | to do |
| `wf03-production.spec.ts` | WF-03 Production and rendering (DS-03a, DS-03b) | Trần Nguyễn Hoàng Lê | to do |
| `wf04-review-publish.spec.ts` | WF-04 Clip review and publishing (DS-04a, DS-04b) | Phan Thế Trung | to do |

## Run

Needs Java 17, Maven and the STEMotion_BE checkout next to this repo (`../STEMotion_BE`).

```bash
npx playwright install chromium   # once
npm run e2e                       # starts the back end and Vite, runs every spec
npm run e2e:report                # HTML report with traces and videos of failures
```

`playwright.config.ts` starts two servers unless they already run:

- **Back end**: `STEMotion_BE` test-scope `com.stemotion.e2e.E2eServer` on port 18080: the real API on a
  throwaway embedded PostgreSQL built by the Flyway migrations, seeded with one Admin. AI, TTS and render
  calls are switched off, so a run costs nothing and never touches the shared database.
- **Web**: Vite on port 5174 with `VITE_API_BASE_URL` pointing at that back end.

Environment overrides: `E2E_API_URL`, `E2E_WEB_PORT`, `E2E_BE_DIR`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
Never set `E2E_API_URL` to the shared or production API: the tests create users and workspaces.

## Writing a spec

- Create the accounts a spec needs through the API (`support/api.ts`, `provisionTeam`), with a run id in
  every email so specs never collide; drive the UI only for the steps under test.
- Select by role and label (`getByRole`, `getByLabel`); add a `data-testid` only where neither works.
- Wait on what the user sees (`expect(...).toBeVisible()`), never on fixed sleeps.
- Check the server rule as well as the hidden button (BR-20), as the Leader test does.
- AI drafting, TTS and rendering are off in the E2E back end: mock their responses with `page.route()`.
