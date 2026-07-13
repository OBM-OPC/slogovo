# Slogovo API

## Authentication model

Slogovo uses the supported `@supabase/ssr` flow. The browser submits credentials
to Slogovo API routes; route handlers create or end the Supabase session and set
HttpOnly cookies. Browser code never reads access or refresh tokens.

Protected pages are checked by middleware with `supabase.auth.getUser()`. Every
protected API repeats server-side user verification before accessing data. Cookie
names alone are never treated as proof of authentication.

### Endpoints

- `POST /api/auth/register` — validates `name`, `email`, `password`, and
  `confirmPassword`, then registers with Supabase Auth.
- `POST /api/auth/login` — validates credentials and creates the cookie session.
- `POST /api/auth/logout` — revokes the current session and clears its cookies.
- `GET /api/auth/me` — returns the verified current user or HTTP 401.
- `POST /api/auth/forgot-password` — requests a recovery email without revealing
  whether an account exists.
- `POST /api/auth/reset-password` — verifies the recovery token before changing
  the password.
- `GET /api/progress/load` — returns only the verified user's progress.
- `POST /api/progress/save` — accepts progress only when its `userId` matches the
  verified session user; database RLS enforces the same boundary.

All JSON failures use `{ "error": "..." }` and an appropriate HTTP status. The
server does not return provider tokens or raw credentials.

## Data authorization

All learning records use `user_id = auth.uid()` Row-Level Security policies.
This includes progress (and its settings/achievements), lesson attempts, exercise
results, vocabulary review events, daily activity, and offline sync events.

See [security.md](./security.md) for the full trust boundary and verification
checklist.
