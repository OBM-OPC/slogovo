# Automated testing strategy

Slogovo uses three complementary test layers. A pull request is not considered
validated until all three layers and the content/database validators pass.

## Unit tests

Vitest owns deterministic domain behavior. The suite covers content schema and
inventory validation, answer normalization and evaluation, score/pass/mastery
rules, spaced repetition, session planning, local-date streak calculations,
progress merging, and idempotent synchronization. Unit tests must not call
Supabase or other external services.

Run with:

```bash
npm test
```

## Component tests

Testing Library exercises user-visible behavior for quiz, fill-in, sentence
builder, matching, listening, vocabulary typing, lesson summary, failed lesson
state, and the conversion of a failed required item into a retry format. Prefer
queries by accessible role or label so missing form semantics fail tests.

Component tests run as part of `npm test`.

## End-to-end tests

Playwright covers the browser/server boundary:

- registration, login, HttpOnly session cookies, session expiry, protected
  routes, and logout;
- starting, passing, and failing lessons, including required-item retries;
- due-vocabulary review and queued event synchronization;
- restoring remotely saved progress in a clean second browser context.

The test server starts Next.js against an in-memory Supabase-compatible auth and
PostgREST fixture. It never uses deployed Supabase credentials or production
data. Tests run serially and reset the fixture before each journey.

The focused CSP/login journey reads the document CSP and `x-nonce`, verifies
every rendered Next.js script carries that exact nonce, authenticates through
the hydrated login form, and fails on application `securitypolicyviolation`
events. Browser-extension `contentscript.js` and ObjectMultiplex noise is
excluded because it does not originate in the application. After a production
build, run `E2E_NEXT_MODE=start npx playwright test e2e/csp-login.spec.ts` to
exercise this journey against the unprotected local production server instead
of a Vercel-protected preview.

Run with:

```bash
npm run test:e2e
```

Local runs use `/usr/bin/chromium` by default. Override it with
`PLAYWRIGHT_CHROMIUM_PATH`. CI installs Playwright Chromium and its dependencies
before running the suite.

## CI gate

The CI validation order is type checking, linting, database workflow
validation, Vitest, Playwright, and the production build (which includes full
content validation). Failed traces, screenshots, and CI videos are retained by
Playwright for diagnosis.
