-- HL Accounting — database schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0 and length(name) <= 120),
  phone       text check (length(coalesce(phone,'')) <= 60),
  tier        text not null check (tier in ('mrp','d15','d25','d35','d42','d50')),
  order_date  date not null,
  closed_at   date,
  delivery    integer not null default 0 check (delivery >= 0),
  items       jsonb not null default '[]'::jsonb,
  payments    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- For a database created before the delivery column existed:
alter table public.accounts add column if not exists delivery integer not null default 0;

-- Fast lookups of "my accounts", open ones first.
create index if not exists accounts_user_idx on public.accounts (user_id, closed_at, order_date desc);

-- ── Row Level Security ──────────────────────────────────────────
-- This is the part that guarantees isolation. With RLS on and these
-- policies in place, the database itself refuses to return another
-- user's rows — it cannot be bypassed by editing the website's code,
-- because the check happens on the server against the signed-in user.

alter table public.accounts enable row level security;
alter table public.accounts force row level security;

drop policy if exists "read own accounts"   on public.accounts;
drop policy if exists "insert own accounts" on public.accounts;
drop policy if exists "update own accounts" on public.accounts;
drop policy if exists "delete own accounts" on public.accounts;

create policy "read own accounts" on public.accounts
  for select to authenticated
  using (auth.uid() = user_id);

create policy "insert own accounts" on public.accounts
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "update own accounts" on public.accounts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);   -- stops a row being reassigned to someone else

create policy "delete own accounts" on public.accounts
  for delete to authenticated
  using (auth.uid() = user_id);

-- Anonymous (not signed in) visitors get nothing: no policy grants them anything.

-- ── keep updated_at honest ──────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.user_id    = old.user_id;   -- ownership can never change
  return new;
end $$;

drop trigger if exists accounts_touch on public.accounts;
create trigger accounts_touch before update on public.accounts
  for each row execute function public.touch_updated_at();
