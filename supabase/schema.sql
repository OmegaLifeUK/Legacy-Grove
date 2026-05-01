-- ============================================================================
-- Legacy Grove — Database Schema (Phase 1)
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable pgcrypto for bcrypt password hashing
create extension if not exists pgcrypto;

-- ─── TABLES ─────────────────────────────────────────────────────────────────

-- 1. SCHOOLS
create table schools (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  code varchar(20) not null unique,
  created_at timestamptz default now()
);

-- 2. ADMINS — teachers / super admins
create table admins (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  email varchar(255) not null unique,
  password_hash text not null,
  display_name varchar(100) not null,
  role varchar(20) not null default 'teacher',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. KIDS — children who use the app
create table kids (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  name varchar(100) not null,
  username varchar(50) not null,
  password_hash text not null,
  assigned_tree_id uuid,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz,
  unique(school_id, username)
);

-- 4. TREES — persistent virtual trees that pass between kids
create table trees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  species varchar(20) not null,
  h2o int not null default 60,
  light int not null default 65,
  soil int not null default 60,
  bio int not null default 45,
  clean int not null default 70,
  mood int not null default 70,
  mulched boolean default false,
  staked boolean default false,
  has_birdhouse boolean default false,
  infested boolean default false,
  fungal boolean default false,
  current_event varchar(20),
  day real not null default 1,
  rings int not null default 0,
  ring_history jsonb default '[]'::jsonb,
  clean_count int default 0,
  feed_count int default 0,
  water_wise_days int default 0,
  eco_shields_held int default 0,
  eco_shield_expiry timestamptz,
  missions_for_shield int default 0,
  current_kid_id uuid references kids(id),
  status varchar(20) not null default 'available',
  assigned_at timestamptz,
  last_visit_at timestamptz,
  event_started_at timestamptz,
  last_ring_day int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add FK from kids.assigned_tree_id now that trees exists
alter table kids add constraint kids_assigned_tree_fk
  foreign key (assigned_tree_id) references trees(id);

-- 5. CARE SESSIONS — 7-day window linking one kid to one tree
create table care_sessions (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references trees(id),
  kid_id uuid not null references kids(id),
  start_day real not null default 1,
  status varchar(20) not null default 'active',
  pass_on_message text,
  badges_earned jsonb default '[]'::jsonb,
  completed_missions jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- 6. CARE CHAIN — kind messages left by each kid
create table care_chain (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references trees(id),
  kid_id uuid not null references kids(id),
  care_session_id uuid references care_sessions(id),
  name varchar(100) not null,
  message text not null,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 7. ACTION LOG — every action recorded for history
create table action_log (
  id uuid primary key default gen_random_uuid(),
  care_session_id uuid not null references care_sessions(id),
  action_key varchar(30) not null,
  day real not null,
  stat_changes jsonb,
  performed_at timestamptz default now()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────

create index idx_schools_code on schools(code);
create index idx_admins_school on admins(school_id);
create index idx_admins_email on admins(email);
create index idx_kids_school on kids(school_id);
create index idx_kids_assigned_tree on kids(assigned_tree_id);
create index idx_kids_school_username on kids(school_id, username);
create index idx_trees_status on trees(status);
create index idx_trees_school on trees(school_id);
create index idx_trees_current_kid on trees(current_kid_id);
create index idx_care_sessions_tree on care_sessions(tree_id);
create index idx_care_sessions_kid on care_sessions(kid_id);
create index idx_care_sessions_active on care_sessions(status) where status = 'active';
create index idx_care_chain_tree on care_chain(tree_id);
create index idx_action_log_session on action_log(care_session_id);

-- ─── TRIGGERS ───────────────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trees_updated_at
  before update on trees
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────

alter table schools enable row level security;
alter table admins enable row level security;
alter table kids enable row level security;
alter table trees enable row level security;
alter table care_sessions enable row level security;
alter table care_chain enable row level security;
alter table action_log enable row level security;

-- Schools: read-only for anon
create policy "anon_read_schools" on schools for select using (true);

-- Admins: read/insert/update for anon (app-level auth, not Supabase auth)
create policy "anon_read_admins" on admins for select using (true);
create policy "anon_insert_admins" on admins for insert with check (true);
create policy "anon_update_admins" on admins for update using (true);

-- Kids: read/insert/update for anon
create policy "anon_read_kids" on kids for select using (true);
create policy "anon_insert_kids" on kids for insert with check (true);
create policy "anon_update_kids" on kids for update using (true);

-- Trees: read/insert/update for anon
create policy "anon_read_trees" on trees for select using (true);
create policy "anon_insert_trees" on trees for insert with check (true);
create policy "anon_update_trees" on trees for update using (true);

-- Care sessions: read/insert/update for anon
create policy "anon_read_sessions" on care_sessions for select using (true);
create policy "anon_insert_sessions" on care_sessions for insert with check (true);
create policy "anon_update_sessions" on care_sessions for update using (true);

-- Care chain: read/insert for anon
create policy "anon_read_chain" on care_chain for select using (true);
create policy "anon_insert_chain" on care_chain for insert with check (true);

-- Action log: read/insert for anon
create policy "anon_read_actions" on action_log for select using (true);
create policy "anon_insert_actions" on action_log for insert with check (true);

-- ─── PASSWORD FUNCTIONS ────────────────────────────────────────────────────

create or replace function hash_password(raw_password text)
returns text as $$
begin
  return crypt(raw_password, gen_salt('bf', 10));
end;
$$ language plpgsql security definer;

create or replace function verify_password(raw_password text, hashed text)
returns boolean as $$
begin
  return hashed = crypt(raw_password, hashed);
end;
$$ language plpgsql security definer;
