# Slogovo API

## Authentication model

Slogovo uses the supported `@supabase/ssr` flow. The browser submits credentials
to Slogovo API routes; route handlers create or end the Supabase session and set
HttpOnly cookies. Browser code never reads access or refresh tokens.

Protected pages are checked by middleware with `supabase.auth.getUser()`. Every
protected API repeats server-side user verification before accessing data. Cookie
names alone are never treated as proof of authentication.

### Endpoints

- `POST /api/auth/register` — validates a 12–128 character passphrase and always
  returns the same accepted response for a new or existing address.
- `POST /api/auth/login` — validates credentials and creates the cookie session.
- `POST /api/auth/logout` — revokes the current session and clears its cookies.
- `GET /api/auth/me` — returns the verified current user or HTTP 401.
- `POST /api/auth/forgot-password` — requests a recovery email without revealing
  whether an account exists.
- `POST /api/auth/reset-password` — verifies the recovery token before changing
  the password.
- `GET /api/progress/load` — returns only the verified user's progress.
- `POST /api/progress/save` — validates the full compatibility payload but stores
  only user-editable settings. Scores, streaks, achievements, XP, and aggregate
  progress are rebuilt from verified sync events.
- `POST /api/sync` — accepts strict `schemaVersion: 1` batches, validates content
  IDs and answers, and atomically deduplicates client event IDs.
- `POST /api/tts/fish` — authenticated, bounded, throttled Bulgarian TTS using a
  server-controlled voice/provider request.
- `GET /api/account/export` — downloads the verified user's account/learning
  data without tokens.
- `DELETE /api/account/learning-data` and `DELETE /api/account/delete` — require
  the current password plus exact destructive confirmation.
- `PATCH /api/account/password`, `PATCH /api/account/email`, and
  `GET|DELETE /api/account/sessions` — reauthenticate sensitive changes and
  expose/revoke sessions without returning tokens.

State-changing APIs require a same-origin `Origin`; JSON routes require
`application/json`, bounded byte size, and bounded nesting depth. Route-specific
IP/email/user limits return HTTP 429 with `Retry-After`. All JSON failures use
`{ "error": "..." }` and an appropriate HTTP status. The server does not return
provider tokens or raw credentials.

## Data authorization

All learning records use `user_id = auth.uid()` Row-Level Security policies.
This includes progress (and its settings/achievements), lesson attempts, exercise
results, vocabulary review events, daily activity, and offline sync events.

See [security.md](./security.md) for the full trust boundary and verification
checklist.
