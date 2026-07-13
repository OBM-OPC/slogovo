# Authentication and data-security contract

## Trust boundaries

- Supabase access and refresh tokens are stored only in `HttpOnly`, `SameSite=Lax`
  cookies. Production cookies are also `Secure`.
- Login, registration, current-user lookup, and logout run through Slogovo's
  server routes. Client components never read or persist auth tokens.
- Middleware refreshes the Supabase session and calls `auth.getUser()` before a
  protected page or API is allowed through.
- Protected API handlers independently call `auth.getUser()`; middleware is
  defense in depth, not their only authorization check.
- Public/publishable Supabase keys may be used by the app. Service-role keys are
  server-only and are not referenced by browser code.

## Row-Level Security coverage

| Learning data | Storage | Ownership policy |
| --- | --- | --- |
| Progress, settings, achievements | `user_progress` | `auth.uid() = user_id` |
| Lesson history | `lesson_attempts` | `auth.uid() = user_id` |
| Item outcomes | `exercise_results` | `auth.uid() = user_id` |
| Vocabulary review history | `vocabulary_review_events` | `auth.uid() = user_id` |
| Activity history | `daily_activity` | `auth.uid() = user_id` |
| Offline audit queue | `offline_events` | `auth.uid() = user_id` |

The schema-contract test verifies that every table above enables RLS and retains
the ownership predicate. Migrations must not broaden those policies.

## Secret handling

- `.env` and `.env.*` are ignored; only `.env.example` is tracked.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is intentionally public and must never be
  replaced with a service-role key.
- `SUPABASE_SERVICE_ROLE_KEY`, SMTP passwords, and TTS provider keys belong only in
  managed server environments. Do not log them or expose them through `NEXT_PUBLIC_*`.
- If a real credential is ever committed, do not rewrite public history
  automatically. Revoke/rotate it through the owner and document the incident.

## Verification before release

1. Run `npm run type-check`, `npm run lint`, `npm test`, and `npm run build`.
2. Verify anonymous requests to protected pages redirect to `/login` and protected
   APIs return 401.
3. Verify login survives a refresh, logout invalidates the session, and expired
   sessions are rejected.
4. Verify a user cannot select, insert, update, or delete another user's rows for
   every RLS-protected table.
5. Review migrations and generated database types; never edit production tables
   manually.
