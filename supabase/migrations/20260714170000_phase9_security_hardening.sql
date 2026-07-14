-- Phase 9 security hardening. This migration is source-reviewed here but must
-- still follow the owner-controlled staging/production procedure in
-- docs/database-workflow.md.

-- Shared fixed-window counters used by application routes. Direct table access
-- is denied; callers can only consume a bounded counter through the function.
create table if not exists public.request_rate_limits (
  key_hash text not null,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, scope, window_started_at),
  constraint request_rate_limits_key_hash check (key_hash ~ '^[a-f0-9]{64}$'),
  constraint request_rate_limits_scope check (scope ~ '^[a-z0-9_-]{1,80}$')
);

alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from public, anon, authenticated;

create or replace function public.consume_request_rate_limit(
  p_key_hash text,
  p_scope text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_key_hash !~ '^[a-f0-9]{64}$'
     or p_scope !~ '^[a-z0-9_-]{1,80}$'
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit arguments';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.request_rate_limits (
    key_hash, scope, window_started_at, request_count, updated_at
  ) values (
    p_key_hash, p_scope, v_window_started_at, 1, v_now
  )
  on conflict (key_hash, scope, window_started_at)
  do update set
    request_count = public.request_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_request_count;

  return query select
    v_request_count <= p_limit,
    greatest(p_limit - v_request_count, 0),
    greatest(
      ceil(extract(epoch from (v_window_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer,
      1
    );
end;
$$;

revoke all on function public.consume_request_rate_limit(text, text, integer, integer)
  from public;
grant execute on function public.consume_request_rate_limit(text, text, integer, integer)
  to anon, authenticated;

alter table public.vocabulary_review_events
  add column if not exists response_time_ms integer,
  add column if not exists error_category text;

alter table public.vocabulary_review_events
  drop constraint if exists vocabulary_review_events_response_time_check;
alter table public.vocabulary_review_events
  add constraint vocabulary_review_events_response_time_check
  check (response_time_ms is null or response_time_ms between 0 and 3600000);

alter table public.vocabulary_review_events
  drop constraint if exists vocabulary_review_events_error_category_check;
alter table public.vocabulary_review_events
  add constraint vocabulary_review_events_error_category_check
  check (error_category is null or error_category in (
    'vocabulary', 'cyrillic-confusion', 'article-usage', 'verb-conjugation',
    'gender-agreement', 'word-order', 'listening-confusion', 'bulgarian-clitics'
  ));

-- A clean project does not implicitly grant table privileges for migrations.
-- Grant only operations that have matching user-owned RLS policies; anonymous
-- clients receive no direct learning-data or telemetry table access.
revoke all on public.user_progress, public.lesson_attempts,
  public.exercise_results, public.vocabulary_review_events,
  public.daily_activity, public.offline_events, public.telemetry_events
  from public, anon;

grant select, insert, update, delete on public.user_progress,
  public.lesson_attempts, public.exercise_results, public.daily_activity,
  public.offline_events to authenticated;
grant select, insert, delete on public.vocabulary_review_events to authenticated;
grant insert on public.telemetry_events to authenticated;

-- Harden the legacy public profile table only when it is present. Supabase Auth
-- remains authoritative for email verification and recovery tokens.
do $$
begin
  if to_regclass('public.users') is not null then
    execute 'revoke update on public.users from anon, authenticated';
    execute 'grant update (name, image) on public.users to authenticated';
    execute 'drop policy if exists "Users can update their own data" on public.users';
    execute 'create policy "Users can update their own data" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id)';
  end if;

  if to_regclass('public.accounts') is not null then
    execute 'revoke all on public.accounts from anon, authenticated';
    execute 'drop policy if exists "Users can view their own accounts" on public.accounts';
  end if;
end $$;

-- Recreate the optional signup trigger function only when the legacy profile
-- table exists. Fully qualified objects and an empty search path prevent object
-- shadowing under SECURITY DEFINER.
do $$
begin
  if to_regclass('public.users') is not null then
    execute $function$
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        insert into public.users (id, email, name, image)
        values (
          new.id,
          new.email,
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'avatar_url'
        )
        on conflict (id) do nothing;
        return new;
      end;
      $body$
    $function$;
    execute 'revoke all on function public.handle_new_user() from public, anon, authenticated';
  end if;
end $$;

-- Make ownership preservation explicit for every mutable user-owned table.
drop policy if exists "Users can update own progress" on public.user_progress;
create policy "Users can update own progress" on public.user_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own lesson attempts" on public.lesson_attempts;
create policy "Users can update own lesson attempts" on public.lesson_attempts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own exercise results" on public.exercise_results;
create policy "Users can update own exercise results" on public.exercise_results
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily activity" on public.daily_activity;
create policy "Users can update own daily activity" on public.daily_activity
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own offline events" on public.offline_events;
create policy "Users can update own offline events" on public.offline_events
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
