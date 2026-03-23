-- Search history table: logs every job board click from Find Jobs tab
create table if not exists public.search_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  query        text not null default '',
  location     text not null default '',
  radius       text not null default '',
  job_type     text not null default '',
  industry     text not null default '',
  board_id     text not null default '',
  board_name   text not null default '',
  searched_at  timestamptz not null default now()
);

create index if not exists search_history_user_id_idx on public.search_history(user_id);
create index if not exists search_history_searched_at_idx on public.search_history(user_id, searched_at desc);

alter table public.search_history enable row level security;

create policy "search_history: select own"
  on public.search_history for select
  using (auth.uid() = user_id);

create policy "search_history: insert own"
  on public.search_history for insert
  with check (auth.uid() = user_id);

create policy "search_history: delete own"
  on public.search_history for delete
  using (auth.uid() = user_id);
