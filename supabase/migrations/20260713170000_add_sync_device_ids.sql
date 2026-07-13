-- Preserve the originating device for idempotent multi-device learning events.
-- Existing production rows are retained and marked as legacy imports.

alter table public.vocabulary_review_events
  add column if not exists device_id text not null default 'legacy';
alter table public.daily_activity
  add column if not exists device_id text not null default 'legacy';
alter table public.offline_events
  add column if not exists device_id text not null default 'legacy';
alter table public.lesson_attempts
  add column if not exists device_id text not null default 'legacy';
alter table public.exercise_results
  add column if not exists device_id text not null default 'legacy';

-- A non-partial unique index can be inferred by PostgREST's ON CONFLICT clause.
-- PostgreSQL still permits multiple null client ids for historical/manual records.
drop index if exists public.idx_lesson_attempts_client_event_id;
drop index if exists public.idx_exercise_results_client_event_id;
create unique index if not exists idx_lesson_attempts_client_event_id
  on public.lesson_attempts(user_id, client_event_id);
create unique index if not exists idx_exercise_results_client_event_id
  on public.exercise_results(user_id, client_event_id);

alter table public.vocabulary_review_events alter column device_id drop default;
alter table public.daily_activity alter column device_id drop default;
alter table public.offline_events alter column device_id drop default;
alter table public.lesson_attempts alter column device_id drop default;
alter table public.exercise_results alter column device_id drop default;
