-- Migration: add granular learning-event tables for normalized sync.
-- The user_progress aggregate table remains as a read cache.

-- Vocabulary review events: one row per review action.
create table if not exists public.vocabulary_review_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  word_id text not null,
  rating text not null,
  reviewed_at timestamptz default now() not null,
  client_event_id text not null,
  created_at timestamptz default now(),
  unique(user_id, client_event_id)
);

-- Daily activity events: idempotent minutes/vocab per day per device/action.
create table if not exists public.daily_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date text not null,
  minutes int default 0 not null,
  vocabulary_count int default 0 not null,
  client_event_id text not null,
  created_at timestamptz default now(),
  unique(user_id, client_event_id)
);

-- Offline learning-event queue (server-side fallback / audit log).
create table if not exists public.offline_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null,
  payload jsonb not null,
  client_event_id text not null,
  synced boolean default false not null,
  error_count int default 0 not null,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, client_event_id)
);

-- Add idempotency columns to existing tables where appropriate.
alter table public.lesson_attempts
  add column if not exists client_event_id text;

alter table public.exercise_results
  add column if not exists client_event_id text;

-- Add unique partial indexes for idempotency where the column is set.
create unique index if not exists idx_lesson_attempts_client_event_id
  on public.lesson_attempts(user_id, client_event_id)
  where client_event_id is not null;

create unique index if not exists idx_exercise_results_client_event_id
  on public.exercise_results(user_id, client_event_id)
  where client_event_id is not null;

-- Enable RLS.
alter table public.vocabulary_review_events enable row level security;
alter table public.daily_activity enable row level security;
alter table public.offline_events enable row level security;

-- RLS policies.
create policy "Users can view own review events" on public.vocabulary_review_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own review events" on public.vocabulary_review_events
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own review events" on public.vocabulary_review_events
  for delete using (auth.uid() = user_id);

create policy "Users can view own daily activity" on public.daily_activity
  for select using (auth.uid() = user_id);
create policy "Users can insert own daily activity" on public.daily_activity
  for insert with check (auth.uid() = user_id);
create policy "Users can update own daily activity" on public.daily_activity
  for update using (auth.uid() = user_id);
create policy "Users can delete own daily activity" on public.daily_activity
  for delete using (auth.uid() = user_id);

create policy "Users can view own offline events" on public.offline_events
  for select using (auth.uid() = user_id);
create policy "Users can insert own offline events" on public.offline_events
  for insert with check (auth.uid() = user_id);
create policy "Users can update own offline events" on public.offline_events
  for update using (auth.uid() = user_id);
create policy "Users can delete own offline events" on public.offline_events
  for delete using (auth.uid() = user_id);

-- Indexes for fast lookups.
create index if not exists idx_review_events_user_word on public.vocabulary_review_events(user_id, word_id);
create index if not exists idx_review_events_user_reviewed on public.vocabulary_review_events(user_id, reviewed_at);
create index if not exists idx_daily_activity_user_date on public.daily_activity(user_id, date);
create index if not exists idx_offline_events_user_synced on public.offline_events(user_id, synced);
create index if not exists idx_offline_events_client_id on public.offline_events(user_id, client_event_id);
