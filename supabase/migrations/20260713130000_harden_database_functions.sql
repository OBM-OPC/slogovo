-- Prevent trigger/helper functions from being called through the public API.
-- No tables or user data are modified by this migration.

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

-- Supabase may install this helper outside the application migrations. Keep the
-- function available to its owning event trigger while removing API execution.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
