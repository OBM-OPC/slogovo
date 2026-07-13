-- Post-merge foundation integration.
-- Safe to apply after 20260713010000_add_granular_learning_tables.sql.
-- Existing progress is preserved; new fields backfill to empty collections / false / zero.

alter table public.user_progress
  add column if not exists mastered_lessons text[] not null default '{}',
  add column if not exists lesson_scores jsonb not null default '{}',
  add column if not exists recorded_attempt_ids text[] not null default '{}';

alter table public.lesson_attempts
  add column if not exists active_time_seconds integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists incorrect_count integer not null default 0,
  add column if not exists required_score integer not null default 70,
  add column if not exists mastered boolean not null default false;

comment on column public.user_progress.mastered_lessons is
  'Lesson ids meeting mastery criteria. Existing rows backfill to an empty array.';
comment on column public.user_progress.lesson_scores is
  'Best calculated lesson score by lesson id. Existing rows backfill to an empty object.';
comment on column public.user_progress.recorded_attempt_ids is
  'Client attempt ids already folded into aggregate progress; prevents retry double-counting.';

-- This migration does not replace or broaden any policy. Fail if the owning tables are not RLS protected.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('user_progress', 'lesson_attempts', 'exercise_results')
      and not c.relrowsecurity
  ) then
    raise exception 'Expected RLS to remain enabled on progress and attempt tables';
  end if;
end $$;
