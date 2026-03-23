-- Application Tracker table
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default '',
  company         text not null default '',
  status          text not null default 'Researching',
  ghost_score     integer not null default 0,
  verdict         text not null default 'UNKNOWN',
  notes           text not null default '',
  url             text not null default '',
  job_board       text not null default '',
  listing_text    text not null default '',
  followup_date   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists applications_user_id_idx on public.applications(user_id);

-- Enable RLS
alter table public.applications enable row level security;

-- Policies: users can only access their own rows
create policy "applications: select own"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "applications: insert own"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "applications: update own"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "applications: delete own"
  on public.applications for delete
  using (auth.uid() = user_id);
