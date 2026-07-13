# Learning-domain architecture

## Trust boundaries

- Content files define stable lesson, exercise, and item IDs plus authored accepted answers.
- Exercise components collect interaction data and provide immediate feedback, but client score,
  correctness, pass/mastery, XP, required flags, productive flags, and accepted answers are not
  authoritative.
- `POST /api/sync` verifies the Supabase session, parses a bounded shared schema, maps every
  submitted item back to repository content, recalculates feedback and correctness, requires every
  required first-attempt item, and rebuilds the lesson attempt before persistence.
- `lesson_attempts`, `exercise_results`, and `vocabulary_review_events` are the granular source of
  truth. `user_progress` is a merge-safe read cache and settings container, not proof that a lesson
  was passed.
- RLS remains the final database ownership boundary. Production migrations and policies are never
  bypassed by application code.

## Domain modules

- `answer-evaluation.ts`: the only typed-answer normalization and evaluation implementation.
- `evaluation.ts`: structured exercise results plus score/pass/mastery calculations.
- `lesson-attempts.ts`: creates calculated lesson attempts and database rows.
- `server-attempt-validation.ts`: verifies client item results against authored content.
- `sync-schema.ts` and `progress-schema.ts`: bounded network contracts.
- `sync-server.ts`: idempotent authenticated persistence.
- `progress-merge.ts`: non-lossy aggregate-cache reconciliation.

UI components may render a domain result, but must not duplicate its business rules.

## Errors and logging

Learning validation failures use `LearningValidationError` with a stable code and optional domain
path. Operational failures use one-line JSON structured logs with an event name and safe scalar
context. Logs must not contain answer payloads, access tokens, refresh tokens, email addresses, or
full request bodies.

Client-side local-storage/network fallbacks may return a recoverable empty or queued state. Server
validation, scoring, and persistence paths must not silently catch failures.

## Review rules

Every learning-domain pull request follows `.github/pull_request_template.md`. Review must verify
strict types, shared schemas, stable IDs, server authority, idempotency, RLS/migration consistency,
error/recovery states, and relevant unit/component/E2E/content/build validation. A rendered feature
is not complete when its data flow, persistence, scoring, or tests are missing.
