# Application security baseline

## Trust boundaries and secrets

- Supabase access and refresh tokens stay in `HttpOnly`, `SameSite=Lax`
  cookies (`Secure` in production); browser components never persist or read
  them.
- Protected middleware and each protected API independently verify the user
  with Supabase Auth. Middleware is defense in depth, not the sole boundary.
- Publishable Supabase keys may be exposed. `SUPABASE_SERVICE_ROLE_KEY`, SMTP
  passwords, TTS keys, and `RATE_LIMIT_HMAC_SECRET` are server-only and must
  never use a `NEXT_PUBLIC_` name or appear in logs.
- If a real credential enters Git history, coordinate owner-led rotation and
  incident handling; do not silently rewrite shared history.

## Browser and request boundary

Every response receives HSTS, MIME-sniffing, frame, referrer, permissions,
cross-origin, and nonce-based Content Security Policy headers. The CSP permits
only Slogovo itself plus the configured Supabase HTTP/WebSocket origin. Audio,
images, fonts, workers, and blob URLs are limited to the explicit directives in
`src/lib/security-headers.ts`; Vercel assets are same-origin. Production never
adds `unsafe-eval`. Inline styles remain allowed because the current
Next/Tailwind stack emits them.

The middleware creates exactly one nonce for each document request, forwards
the CSP and `x-nonce` to the Next.js renderer, and writes the same values to the
final response. The root layout waits for a request so nonce-protected pages
cannot be prerendered or served from the static HTML cache. Supabase session
refreshes and redirect/replacement responses preserve the forwarded headers and
every cookie.

Vercel Deployment Protection is a separate platform login that runs before the
application and cannot validate Slogovo's CSP. Preview smoke tests therefore use
the unprotected local production server. Preview and production application
responses keep the same strict nonce policy; no preview-only CSP relaxation is
enabled.

State-changing API requests require a same-origin `Origin` and JSON content
type (except bodyless DELETE/logout operations). JSON readers enforce byte and
nesting-depth limits. Public API routes use exact matching; `/api/auth/me`,
logout, account, progress, telemetry, synchronization, and TTS are protected.

## Rate limiting and identifiers

Authentication, recovery, registration, synchronization, telemetry, progress,
account, and TTS routes consume purpose-specific IP/email/user counters through
`public.consume_request_rate_limit`. The PostgreSQL function is atomic across
Vercel instances. Only HMAC-SHA-256 keys are stored. Set a server-only
`RATE_LIMIT_HMAC_SECRET` in each deployment environment before the migration is
activated; a deterministic compatibility key and bounded process-local fallback
keep previews functional while the owner-controlled migration is pending.

Logs contain only allowlisted error codes, scopes, statuses, and operation names.
They must never contain passwords, reset tokens, provider tokens, full learner
answers, TTS text, or raw email/IP identifiers.

## Database and Auth

Supabase Auth owns email verification and recovery. The optional legacy
`public.users` table grants client updates only to `name` and `image`. The legacy
`public.accounts` token table has no anon/authenticated privileges or policies.
All mutable user-owned learning policies state both `USING` and `WITH CHECK`.
`handle_new_user()` uses fully-qualified objects, `search_path = ''`, and no
client execution privilege.

Lesson answers, score, pass/mastery, XP, streaks, achievements, and aggregate
progress are rebuilt server-side from content-verified, idempotent attempt and
review rows. The compatibility progress-save route accepts settings only.

## CI and maintenance

CI blocks high/critical dependency findings, scans Git history with Gitleaks,
and runs an OWASP ZAP baseline against a local build without production secrets.
Dependabot groups dependency maintenance to limit PR noise. Repository-native
GitHub secret scanning should additionally be enabled by an owner when the
repository plan exposes it.

`.gitleaks.toml` allowlists only the exact password used by the isolated,
in-memory E2E account. False positives must be narrowed to a specific fake value;
do not exclude whole test files, directories, or secret rules.

Run locally:

```bash
npm audit --audit-level=high
/tmp/gitleaks detect --source . --config .gitleaks.toml --redact
npm run validate:database
npm test
supabase start -x studio,imgproxy,inbucket,edge-runtime,logflare,vector,supavisor
supabase db reset --local
supabase test db
```

Production migrations, service-role/rate-limit secrets, retention settings, and
security-feature toggles remain owner-controlled deployment steps.
