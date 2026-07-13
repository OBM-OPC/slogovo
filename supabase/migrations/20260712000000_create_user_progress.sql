-- Migration: create the canonical user progress aggregate table.
-- This is additive and safe for an empty project. Existing rows are preserved
-- when the table already exists; later migrations add any missing columns.

create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  streak_current integer default 0,
  streak_longest integer default 0,
  streak_last_study_date text,
  completed_lessons text[] default '{}',
  mastered_lessons text[] not null default '{}',
  completed_modules text[] default '{}',
  lesson_scores jsonb not null default '{}',
  recorded_attempt_ids text[] not null default '{}',
  vocabulary_progress jsonb default '{}',
  exercise_stats jsonb default '{"total":0,"correct":0,"wrong":0,"consecutiveCorrect":0}',
  daily_stats jsonb default '{}',
  settings jsonb default '{"dailyGoal":"medium","ttsEnabled":true,"showLatin":true,"speechRate":0.9}',
  achievements text[] default '{}',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can view own progress" on public.user_progress;
create policy "Users can view own progress" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.user_progress;
create policy "Users can insert own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.user_progress;
create policy "Users can update own progress" on public.user_progress
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own progress" on public.user_progress;
create policy "Users can delete own progress" on public.user_progress
  for delete using (auth.uid() = user_id);

create index if not exists idx_user_progress_user_id
  on public.user_progress(user_id);
