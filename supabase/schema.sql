-- Supabase Schema for Slogovo
-- Run this in Supabase SQL Editor

-- Create users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  image text,
  display_name text,
  bio text,
  email_verified timestamptz,
  reset_token text unique,
  reset_token_expiry timestamptz,
  verification_token text unique,
  verification_token_expiry timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on public.users
  for update using (auth.uid() = id);

-- Create accounts table for OAuth
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  unique(provider, provider_account_id)
);

-- Enable RLS for accounts
alter table public.accounts enable row level security;

create policy "Users can view their own accounts" on public.accounts
  for select using (auth.uid() = user_id);

-- Function to handle user creation after auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, image)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
