-- Cognition Lab — Supabase schema. Project: ewasyspwvssafzjpkyvn
-- Idempotent: paste the WHOLE file into the Supabase SQL Editor and Run.
-- Safe to re-run any number of times — it never errors on "already exists".

create table if not exists rooms (
  id text primary key,
  created_at timestamptz default now(),
  state jsonb default '{}'::jsonb
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  player_id text not null,
  player_name text not null,
  decision_text text not null,
  price numeric,
  created_at timestamptz default now()
);

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  diagnoser_id text not null,
  diagnoser_type text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

-- Realtime: add each table to the publication only if not already a member
-- (a bare ALTER PUBLICATION ... ADD TABLE errors on re-run).
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms') then
    alter publication supabase_realtime add table rooms;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submissions') then
    alter publication supabase_realtime add table submissions;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'diagnoses') then
    alter publication supabase_realtime add table diagnoses;
  end if;
end $$;

-- enable RLS is idempotent (no error if already enabled).
alter table rooms enable row level security;
alter table submissions enable row level security;
alter table diagnoses enable row level security;

-- Policies: drop-then-create so re-runs never collide.
-- Permissive by design — zero auth, no PII (see CLAUDE.md constraints).
drop policy if exists "anyone can read rooms" on rooms;
create policy "anyone can read rooms" on rooms for select using (true);
drop policy if exists "anyone can insert rooms" on rooms;
create policy "anyone can insert rooms" on rooms for insert with check (true);
drop policy if exists "anyone can update rooms" on rooms;
create policy "anyone can update rooms" on rooms for update using (true);

drop policy if exists "anyone can read submissions" on submissions;
create policy "anyone can read submissions" on submissions for select using (true);
drop policy if exists "anyone can insert submissions" on submissions;
create policy "anyone can insert submissions" on submissions for insert with check (true);
drop policy if exists "anyone can delete submissions" on submissions;
create policy "anyone can delete submissions" on submissions for delete using (true);

drop policy if exists "anyone can read diagnoses" on diagnoses;
create policy "anyone can read diagnoses" on diagnoses for select using (true);
drop policy if exists "anyone can insert diagnoses" on diagnoses;
create policy "anyone can insert diagnoses" on diagnoses for insert with check (true);
drop policy if exists "anyone can delete diagnoses" on diagnoses;
create policy "anyone can delete diagnoses" on diagnoses for delete using (true);

-- Cleanup of the verification test row (no-op if absent).
delete from rooms where id = 'ZZDELTEST';
