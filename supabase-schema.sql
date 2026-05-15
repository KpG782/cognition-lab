-- Paste this entire file into the Supabase SQL Editor and click Run.
-- Project: ewasyspwvssafzjpkyvn

create table rooms (
  id text primary key,
  created_at timestamptz default now(),
  state jsonb default '{}'::jsonb
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  player_id text not null,
  player_name text not null,
  decision_text text not null,
  price numeric,
  created_at timestamptz default now()
);

create table diagnoses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  diagnoser_id text not null,
  diagnoser_type text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table submissions;
alter publication supabase_realtime add table diagnoses;

alter table rooms enable row level security;
alter table submissions enable row level security;
alter table diagnoses enable row level security;

create policy "anyone can read rooms" on rooms for select using (true);
create policy "anyone can insert rooms" on rooms for insert with check (true);
create policy "anyone can update rooms" on rooms for update using (true);

create policy "anyone can read submissions" on submissions for select using (true);
create policy "anyone can insert submissions" on submissions for insert with check (true);

create policy "anyone can read diagnoses" on diagnoses for select using (true);
create policy "anyone can insert diagnoses" on diagnoses for insert with check (true);
