-- Migration: add per-lesson scoring and mastered-lesson tracking.
-- Preserves existing user_progress rows.

alter table public.user_progress
  add column if not exists mastered_lessons text[] default '{}';

alter table public.user_progress
  add column if not exists lesson_scores jsonb default '{}';
