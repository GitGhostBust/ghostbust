-- Saved searches table: stores searches the user explicitly saves
create table if not exists public.saved_searches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null default '',
  query        text not null default '',
  location     text not null default '',
  radius       text not null default '',
  job_type     text not null default '',
  industry     text not null default '',
  subfield     text not null default '',
  saved_at     timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);

alter table public.saved_searches enable row level security;

create policy "saved_searches: select own"
  on public.saved_searches for select
  using (auth.uid() = user_id);

create policy "saved_searches: insert own"
  on public.saved_searches for insert
  with check (auth.uid() = user_id);

create policy "saved_searches: delete own"
  on public.saved_searches for delete
  using (auth.uid() = user_id);
