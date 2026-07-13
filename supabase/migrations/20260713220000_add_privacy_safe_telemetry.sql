-- First-party, data-minimized learning telemetry.
-- Deliberately omits user id, email, IP address, user agent, transcript,
-- free-form error message, and submitted learner answers.

create table if not exists public.telemetry_events (
  id uuid primary key,
  occurred_at timestamptz not null,
  category text not null check (category in ('learning', 'monitoring')),
  event_name text not null check (event_name in (
    'lesson_started', 'lesson_abandoned', 'lesson_passed', 'lesson_failed',
    'exercise_answered', 'hint_used', 'item_failed', 'item_later_corrected',
    'review_completed', 'audio_replayed', 'daily_session_completed',
    'auth_failure', 'content_loading_error', 'sync_failure', 'audio_failure',
    'database_error', 'invalid_lesson_content', 'client_crash'
  )),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint telemetry_properties_size check (octet_length(properties::text) <= 4096),
  constraint telemetry_properties_allowlist check (
    properties
      - 'lessonId' - 'moduleId' - 'exerciseId' - 'itemId' - 'vocabularyId'
      - 'outcome' - 'reason' - 'source' - 'speed' - 'mode' - 'errorCode'
      - 'statusCode' - 'count' - 'durationBucket' - 'online'
    = '{}'::jsonb
  ),
  constraint telemetry_category_matches_name check (
    (category = 'learning' and event_name in (
      'lesson_started', 'lesson_abandoned', 'lesson_passed', 'lesson_failed',
      'exercise_answered', 'hint_used', 'item_failed', 'item_later_corrected',
      'review_completed', 'audio_replayed', 'daily_session_completed'
    ))
    or
    (category = 'monitoring' and event_name in (
      'auth_failure', 'content_loading_error', 'sync_failure', 'audio_failure',
      'database_error', 'invalid_lesson_content', 'client_crash'
    ))
  )
);

alter table public.telemetry_events enable row level security;

drop policy if exists telemetry_authenticated_insert on public.telemetry_events;
create policy telemetry_authenticated_insert
  on public.telemetry_events
  for insert
  to authenticated
  with check (true);

-- No client SELECT/UPDATE/DELETE policy: only trusted administrative tooling can
-- aggregate the anonymous event rows.

create index if not exists telemetry_events_name_occurred_idx
  on public.telemetry_events (event_name, occurred_at desc);
