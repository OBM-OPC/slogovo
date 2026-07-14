begin;

create extension if not exists pgtap with schema extensions;
select plan(1);

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
) values
  (
    '10000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000001',
    'phase9-test-lesson-a', 'phase9-test-module', 'A1', now(), 1, 'phase9-rls-test-a'
  ),
  (
    '20000000-0000-4000-8000-000000000010',
    '20000000-0000-4000-8000-000000000002',
    'phase9-test-lesson-b', 'phase9-test-module', 'A1', now(), 1, 'phase9-rls-test-b'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

do $$
declare
  visible_own integer;
  visible_other integer;
  changed_other integer;
begin
  select count(*) into visible_own
  from public.user_progress
  where user_id = '10000000-0000-4000-8000-000000000001';
  if visible_own <> 1 then raise exception 'User A cannot read own progress'; end if;

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

  begin
    update public.lesson_attempts
    set user_id = '20000000-0000-4000-8000-000000000002'
    where id = '10000000-0000-4000-8000-000000000010';
    raise exception 'User A can change an ownership field';
  exception when insufficient_privilege then
    null;
  end;

  if to_regclass('public.users') is not null then
    execute 'select count(*) from public.users where id = ''20000000-0000-4000-8000-000000000002'''
      into visible_other;
    if visible_other <> 0 then raise exception 'User A can read User B profile'; end if;
  end if;

end $$;

reset role;

do $$
begin
  if has_table_privilege('anon', 'public.user_progress', 'select') then
    raise exception 'Anonymous client has progress SELECT privilege';
  end if;
  if has_table_privilege('anon', 'public.lesson_attempts', 'select') then
    raise exception 'Anonymous client has attempt SELECT privilege';
  end if;
  if has_table_privilege('anon', 'public.telemetry_events', 'insert') then
    raise exception 'Anonymous client has telemetry INSERT privilege';
  end if;
  if to_regclass('public.accounts') is not null
     and (
       has_table_privilege('authenticated', 'public.accounts', 'select')
       or has_table_privilege('authenticated', 'public.accounts', 'insert')
       or has_table_privilege('authenticated', 'public.accounts', 'update')
       or has_table_privilege('authenticated', 'public.accounts', 'delete')
     ) then
    raise exception 'Authenticated client has provider-token table privileges';
  end if;
end $$;

select pass('two-user ownership, ownership-change, provider-token, and anonymous-access assertions passed');
select * from finish();
rollback;
