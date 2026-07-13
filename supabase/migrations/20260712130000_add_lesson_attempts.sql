-- Migration: add historical lesson attempts and exercise results tables.
-- Preserves existing user_progress data.

-- Enable UUID extension if not already available.
create extension if not exists "uuid-ossp";

-- Lesson attempts: one row per completed lesson attempt.
create table if not exists public.lesson_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_id text not null,
  module_id text not null,
  level text not null,
  results jsonb default '[]' not null,
  total_duration_ms int default 0 not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  first_try_correct int default 0 not null,
  items_answered int default 0 not null,
  passed boolean default false not null,
  completed boolean default false not null,
  accuracy numeric(4,3) default 0 not null,
  score int default 0 not null,
  xp_earned int default 0 not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercise results: one row per answered exercise item (denormalized for easy querying).
create table if not exists public.exercise_results (
  id uuid default gen_random_uuid() primary key,
  attempt_id uuid references public.lesson_attempts(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  exercise_id text not null,
  exercise_type text not null,
  item_id text not null,
  status text not null,
  is_passing boolean default false not null,
  user_answer text,
  correct_answers jsonb default '[]',
  feedback text,
  feedback_needs_review boolean default false,
  duration_ms int default 0 not null,
  answered_at timestamptz default now() not null,
  vocabulary_id text,
  created_at timestamptz default now()
);

-- Enable RLS.
alter table public.lesson_attempts enable row level security;
alter table public.exercise_results enable row level security;

-- Policies: users can only CRUD their own records.
create policy "Users can view own lesson attempts" on public.lesson_attempts
  for select using (auth.uid() = user_id);
create policy "Users can insert own lesson attempts" on public.lesson_attempts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own lesson attempts" on public.lesson_attempts
  for update using (auth.uid() = user_id);
create policy "Users can delete own lesson attempts" on public.lesson_attempts
  for delete using (auth.uid() = user_id);

create policy "Users can view own exercise results" on public.exercise_results
  for select using (auth.uid() = user_id);
create policy "Users can insert own exercise results" on public.exercise_results
  for insert with check (auth.uid() = user_id);
create policy "Users can update own exercise results" on public.exercise_results
  for update using (auth.uid() = user_id);
create policy "Users can delete own exercise results" on public.exercise_results
  for delete using (auth.uid() = user_id);

-- Indexes.
create index if not exists idx_lesson_attempts_user_id on public.lesson_attempts(user_id);
create index if not exists idx_lesson_attempts_lesson_id on public.lesson_attempts(lesson_id);
create index if not exists idx_exercise_results_attempt_id on public.exercise_results(attempt_id);
create index if not exists idx_exercise_results_user_id on public.exercise_results(user_id);

-- Updated-at trigger helper.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
security invoker
set search_path = pg_catalog, public;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists set_lesson_attempts_updated_at on public.lesson_attempts;
create trigger set_lesson_attempts_updated_at
  before update on public.lesson_attempts
  for each row execute function public.set_updated_at();
