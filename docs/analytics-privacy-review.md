# Learning analytics and monitoring privacy review

Status: code-level privacy review completed 2026-07-13. Production migration and any external log/monitoring integration remain owner-controlled operations.

## Purpose and boundary

Slogovo collects first-party events only to answer learning-product questions and detect operational failures. The implementation does not activate a paid analytics SDK or send data to an advertising platform. Events are accepted only for authenticated app sessions, written to Slogovo's own Supabase project, and cannot be selected, updated, or deleted through the client role.

The telemetry table deliberately has no user ID. The browser does not create a device, advertising, or cross-session telemetry identifier. Event IDs exist only for idempotency. Durations are bucketed rather than stored precisely.

## Event schema

Learning events:

- `lesson_started`, `lesson_abandoned`, `lesson_passed`, `lesson_failed`;
- `exercise_answered`, `hint_used`, `item_failed`, `item_later_corrected`;
- `review_completed`, `audio_replayed`, `daily_session_completed`.

Monitoring events:

- `auth_failure`, `content_loading_error`, `sync_failure`, `audio_failure`;
- `database_error`, `invalid_lesson_content`, `client_crash`.

Allowed properties are restricted to Slogovo content identifiers, enumerated outcome/reason/source/mode/error codes, HTTP status, bounded counts, coarse duration buckets, playback speed, and online state. The Zod schema is strict, batches contain at most 50 events, JSON rows are capped at 4 KiB, and tests prove that undeclared fields are rejected.

Authentication failures are emitted as structured server logs because failed logins cannot write authenticated telemetry. Database and request failures use the same controlled error codes. Client crashes intentionally omit the error message, stack, current URL, browser fingerprint, and rejected value.

## Data explicitly excluded

- name, email, account/user ID, IP address, or user agent;
- cookies, device fingerprint, advertising ID, or precise location;
- learner answers, Bulgarian transcript, voice/audio recording, or pronunciation data;
- error messages, stack traces, arbitrary URLs, or arbitrary custom properties;
- exact active-time measurements.

Application progress and lesson attempts remain separate operational data governed by their existing per-user RLS policies; they are not copied into telemetry.

## Operational controls

- Supabase RLS permits authenticated inserts only and exposes no client read policy.
- Aggregation access is limited to owner-controlled administrative tooling.
- Recommended raw-event retention is 90 days; retain only anonymous aggregate counts afterward. Scheduling the purge is a production database action and must be performed by the owner after review.
- Do not connect an external analytics or error-monitoring vendor without a separate data-processing, retention, region, consent, and cost review.
- If future analysis needs identity linkage, free-form properties, exact timestamps beyond operational need, or voice/transcript data, this review must be reopened before implementation.

## Monitoring coverage

Lesson and exercise components emit the learning lifecycle. The sync client records transport and rejected-event failures. Listening records replay and terminal playback failure. Auth and progress routes emit structured auth/database signals. Content validation emits machine-readable invalid-content/load signals in CI. The root client monitor captures unhandled errors and rejected promises without payload details, and the app error boundary reports content-load failures while offering recovery.
