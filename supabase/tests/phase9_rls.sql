begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'phase9-a@example.invalid', 'not-a-real-hash', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'phase9-b@example.invalid', 'not-a-real-hash', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.user_progress (user_id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002');

insert into public.lesson_attempts (
  id, user_id, lesson_id, module_id, level, started_at, items_answered, device_id
) values (
  '20000000-0000-4000-8000-000000000010',
  '20000000-0000-4000-8000-000000000002',
  'phase9-test-lesson', 'phase9-test-module', 'A1', now(), 1, 'phase9-rls-test'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

do $$
declare
  visible_other integer;
  changed_other integer;
begin
  select count(*) into visible_other
  from public.user_progress
  where user_id = '20000000-0000-4000-8000-000000000002';
  if visible_other <> 0 then raise exception 'User A can read User B progress'; end if;

  update public.user_progress set streak_current = 99
  where user_id = '20000000-0000-4000-8000-000000000002';
  get diagnostics changed_other = row_count;
  if changed_other <> 0 then raise exception 'User A can update User B progress'; end if;

  select count(*) into visible_other
  from public.lesson_attempts
  where user_id = '20000000-0000-4000-8000-000000000002';
  if visible_other <> 0 then raise exception 'User A can read User B attempts'; end if;

  if to_regclass('public.users') is not null then
    execute 'select count(*) from public.users where id = ''20000000-0000-4000-8000-000000000002'''
      into visible_other;
    if visible_other <> 0 then raise exception 'User A can read User B profile'; end if;
  end if;

  if to_regclass('public.accounts') is not null then
    execute 'select count(*) from public.accounts' into visible_other;
    if visible_other <> 0 then raise exception 'Authenticated client can read provider token rows'; end if;
  end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare visible_rows integer;
begin
  select count(*) into visible_rows from public.user_progress;
  if visible_rows <> 0 then raise exception 'Anonymous client can read protected progress'; end if;
  select count(*) into visible_rows from public.lesson_attempts;
  if visible_rows <> 0 then raise exception 'Anonymous client can read lesson attempts'; end if;
end $$;

reset role;
rollback;
