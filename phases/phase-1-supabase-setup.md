# Phase 1 Prompt — Supabase Database Setup & Schema

WORKFLOW: Phase 1 — Supabase Database Setup & Schema
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 1 — Supabase Database Setup
[ ] PLAN — Pre-built below, present to user for approval
[ ] SCHEMA — Create all SQL tables, indexes, triggers, RLS policies
[ ] SEED — Insert seed data for testing (school, admin, sample kids, sample trees)
[ ] CLIENT — Set up Supabase client in the React app (supabaseClient.js)
[ ] DB LAYER — Create db.js with all CRUD operations
[ ] ENV — Set up .env with Supabase credentials, .env.example for reference
[ ] TEST — Open Supabase dashboard, click into every table, verify columns/rows/types. Run every db.js function from browser console, verify return values
[ ] DEBUG — Check Supabase logs for errors, verify password hashing round-trips, test RLS denials
[ ] REVIEW — Security review: RLS policy audit, credential exposure check, SQL injection surface
[ ] AUDIT — Grep for hardcoded secrets, verify .env in .gitignore, check no service_role key in frontend
[ ] PROD-READY — Run every db.js function manually, verify seed data matches expected, document any manual Supabase steps
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

**Legacy Grove** is a children's educational app (ages 7–11) where kids care for virtual trees for 7 real calendar days, then pass them on to the next child with a kind message. It's currently a Vite React SPA hosted on GitHub Pages with zero backend — all state is local. We're adding Supabase as the database to enable persistent, shared tree data.

**Tech stack:** Vite + React (JSX, no TypeScript) · Supabase (PostgreSQL) · GitHub Pages (moving to Vercel in Phase 7)
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`
**App entry:** `src/App.jsx` (single-file app, ~1900 lines)
**Target audience:** Single school, teacher-distributed via link/QR

## What Exists (partial — needs cleanup)

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component │ Status │ Notes │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ supabase/schema.sql │ PARTIAL │ Has trees, keepers, care_sessions, care_chain, action_log. │
│ │ │ MISSING: schools, admins, kids (auth), proper RLS. │
│ │ │ Needs full rewrite to match new requirements. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ src/supabaseClient.js │ EXISTS │ Basic createClient() reading from env vars. Needs review. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ src/db.js │ EXISTS │ Has CRUD functions but uses old "keepers" table. │
│ │ │ Needs rewrite to use "kids" table + new schema. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .env / .env.example │ PARTIAL │ .env.example exists with placeholder values. │
│ │ │ User needs to provide real Supabase URL + anon key. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .gitignore │ EXISTS │ Already ignores .env and .env.local. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ package.json │ EXISTS │ @supabase/supabase-js already installed. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ App.jsx integration │ PARTIAL │ Has db import, join screen, loading screen, auto-save logic. │
│ │ │ But references old schema (keepers table). Will need │
│ │ │ updates after Phase 1 schema is finalized. │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## Full Database Schema (to be created in Supabase SQL Editor)

### Table: schools

```sql
create table schools (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  code varchar(20) not null unique,        -- teacher uses this to link kids to school
  created_at timestamptz default now()
);
```

### Table: admins

```sql
create table admins (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  email varchar(255) not null unique,
  password_hash text not null,              -- bcrypt hash, done via Supabase edge function or pgcrypto
  display_name varchar(100) not null,
  role varchar(20) not null default 'teacher',  -- 'teacher' or 'super_admin'
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### Table: kids

```sql
create table kids (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  name varchar(100) not null,
  username varchar(50) not null,            -- unique within school
  password_hash text not null,              -- bcrypt hash
  assigned_tree_id uuid references trees(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz,
  unique(school_id, username)
);
```

### Table: trees

```sql
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
  status varchar(20) not null default 'available',  -- 'available', 'assigned', 'dead'
  assigned_at timestamptz,                           -- when the current kid was assigned
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Table: care_sessions

```sql
create table care_sessions (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references trees(id),
  kid_id uuid not null references kids(id),
  start_day real not null default 1,
  status varchar(20) not null default 'active',  -- 'active', 'completed', 'expired'
  pass_on_message text,
  badges_earned jsonb default '[]'::jsonb,
  completed_missions jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  ended_at timestamptz
);
```

### Table: care_chain

```sql
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
```

### Table: action_log

```sql
create table action_log (
  id uuid primary key default gen_random_uuid(),
  care_session_id uuid not null references care_sessions(id),
  action_key varchar(30) not null,
  day real not null,
  stat_changes jsonb,
  performed_at timestamptz default now()
);
```

### Indexes

```sql
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
```

### Triggers

```sql
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
```

### Row Level Security

```sql
-- Enable RLS on all tables
alter table schools enable row level security;
alter table admins enable row level security;
alter table kids enable row level security;
alter table trees enable row level security;
alter table care_sessions enable row level security;
alter table care_chain enable row level security;
alter table action_log enable row level security;

-- Public read access for app functionality (anon key)
-- Write access controlled by application logic
create policy "anon_read_schools" on schools for select using (true);
create policy "anon_read_kids" on kids for select using (true);
create policy "anon_insert_kids" on kids for insert with check (true);
create policy "anon_update_kids" on kids for update using (true);
create policy "anon_read_trees" on trees for select using (true);
create policy "anon_insert_trees" on trees for insert with check (true);
create policy "anon_update_trees" on trees for update using (true);
create policy "anon_read_sessions" on care_sessions for select using (true);
create policy "anon_insert_sessions" on care_sessions for insert with check (true);
create policy "anon_update_sessions" on care_sessions for update using (true);
create policy "anon_read_chain" on care_chain for select using (true);
create policy "anon_insert_chain" on care_chain for insert with check (true);
create policy "anon_read_actions" on action_log for select using (true);
create policy "anon_insert_actions" on action_log for insert with check (true);
create policy "anon_read_admins" on admins for select using (true);
create policy "anon_insert_admins" on admins for insert with check (true);
create policy "anon_update_admins" on admins for update using (true);
```

### Password Hashing

```sql
-- Enable pgcrypto for bcrypt password hashing
create extension if not exists pgcrypto;

-- Helper function to hash passwords
create or replace function hash_password(raw_password text)
returns text as $$
begin
  return crypt(raw_password, gen_salt('bf', 10));
end;
$$ language plpgsql security definer;

-- Helper function to verify passwords
create or replace function verify_password(raw_password text, hashed text)
returns boolean as $$
begin
  return hashed = crypt(raw_password, hashed);
end;
$$ language plpgsql security definer;
```

## Seed Data

```sql
-- Seed school
insert into schools (name, code) values ('Omega Life School', 'OMEGA2026');

-- Seed admin (password: admin123)
insert into admins (school_id, email, password_hash, display_name, role)
select id, 'admin@omegalife.uk', hash_password('admin123'), 'Mr. Carter', 'super_admin'
from schools where code = 'OMEGA2026';

-- Seed test kids (password: tree123 for all)
insert into kids (school_id, name, username, password_hash)
select s.id, 'Alex Johnson', 'alex', hash_password('tree123') from schools s where s.code = 'OMEGA2026'
union all
select s.id, 'Bella Khan', 'bella', hash_password('tree123') from schools s where s.code = 'OMEGA2026'
union all
select s.id, 'Charlie Davis', 'charlie', hash_password('tree123') from schools s where s.code = 'OMEGA2026';
```

## db.js Rewrite Specification

The existing `src/db.js` must be rewritten to use the new schema. Key changes:

- Replace all `keepers` references with `kids`
- Add `authenticateKid(schoolCode, username, password)` — calls `verify_password` RPC
- Add `authenticateAdmin(email, password)` — calls `verify_password` RPC
- All tree queries scoped by `school_id`
- `treeToDb()` / `dbToTree()` mappers updated for new column names
- Add `getSchoolByCode(code)` for login flow
- All composite operations (`startNewTree`, `receiveExistingTree`, `passOnTree`, `loadSession`) updated

## Files to Create / Modify

| File                    | Action  | Description                                                     |
| ----------------------- | ------- | --------------------------------------------------------------- |
| `supabase/schema.sql`   | REWRITE | Full schema with all 7 tables, indexes, RLS, functions          |
| `supabase/seed.sql`     | CREATE  | Seed data (school, admin, test kids)                            |
| `src/supabaseClient.js` | REVIEW  | Should be fine as-is, verify error handling                     |
| `src/db.js`             | REWRITE | All CRUD ops updated for new schema                             |
| `.env.example`          | UPDATE  | Ensure both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY listed |
| `.env`                  | CREATE  | User provides real credentials (not committed)                  |

## Verification Checklist

After this phase, verify:

- [ ] All 7 tables created in Supabase dashboard
- [ ] Seed school "Omega Life School" exists with code "OMEGA2026"
- [ ] Seed admin can be queried
- [ ] Seed kids (alex, bella, charlie) can be queried
- [ ] `verify_password('tree123', kids.password_hash)` returns true for seed kids
- [ ] RLS policies allow anon key to read/write all tables
- [ ] `npm run build` succeeds with new db.js
- [ ] `.env` is NOT committed (check .gitignore)

## Security Review (REVIEW stage)

Run these checks after BUILD is complete:

### RLS Policy Audit

```
For each table, verify:
1. SELECT — can anon key read? Should it? Which rows?
2. INSERT — can anon key insert? With what constraints?
3. UPDATE — can anon key update? Which columns?
4. DELETE — can anon key delete? (Should be NO for most tables)
```

Specific tests:

- [ ] Anon key CANNOT delete from any table (no DELETE policies)
- [ ] Anon key CANNOT read admins.password_hash directly (verify with: `supabase.from('admins').select('password_hash')` — should return empty or error)
- [ ] Anon key CANNOT read kids.password_hash directly
- [ ] School A's data is NOT visible when querying with School B's school_id (cross-tenant isolation)
- [ ] Verify `verify_password` function is `SECURITY DEFINER` (runs with elevated privileges, not exposed directly)

### Credential Exposure Check

- [ ] `grep -r "supabase" src/ --include="*.js" --include="*.jsx"` — verify no hardcoded URLs or keys
- [ ] `grep -r "password" src/ --include="*.js" --include="*.jsx"` — verify no plaintext passwords in code
- [ ] `grep -r "secret\|key\|token" src/` — no secrets in source
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has placeholder values only (no real credentials)
- [ ] `git log --all -p -- .env` — verify .env was NEVER committed in history
- [ ] No `service_role` key anywhere in the frontend (only `anon` key is safe for frontend)

### SQL Injection Surface

- [ ] All Supabase JS client calls use parameterized queries (the SDK does this by default)
- [ ] No raw SQL strings constructed from user input in db.js
- [ ] `hash_password` and `verify_password` functions use parameterized calls via RPC

## Audit (AUDIT stage)

### Grep Patterns — Run All, Fix Any Hits

```bash
# Hardcoded credentials
grep -rn "password.*=.*['\"]" src/ --include="*.js" --include="*.jsx"
grep -rn "admin123\|tree123\|OMEGA2026" src/ --include="*.js" --include="*.jsx"

# Service role key (MUST NOT be in frontend)
grep -rn "service_role\|serviceRole\|SERVICE_ROLE" src/

# Console.log with sensitive data
grep -rn "console\.\(log\|warn\|error\).*password\|console\.\(log\|warn\|error\).*hash\|console\.\(log\|warn\|error\).*key" src/

# Environment variable exposure
grep -rn "import\.meta\.env" src/ --include="*.js" --include="*.jsx"
# Should ONLY find: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Eval or dangerous patterns
grep -rn "eval\|innerHTML\|dangerouslySetInnerHTML\|document\.write" src/
```

### File Checklist

- [ ] `supabase/schema.sql` — no real credentials, uses `hash_password()` for seeds
- [ ] `supabase/seed.sql` — test passwords only (admin123, tree123), documented as test-only
- [ ] `src/supabaseClient.js` — reads from `import.meta.env` only
- [ ] `src/db.js` — no hardcoded values, all queries parameterized
- [ ] `.gitignore` — includes `.env`, `.env.local`, `.env.*.local`

## Production Readiness (PROD-READY stage)

### Manual Function Test — Run Every db.js Export

Open browser console or write a test script. Call each function and verify:

```
1. getSchoolByCode('OMEGA2026')
   → returns { id, name, code, created_at }
   → returns null for non-existent code

2. authenticateKid('OMEGA2026', 'alex', 'tree123')
   → returns { kid, school } objects
   → returns null for wrong password
   → returns null for wrong school code
   → returns null for non-existent username

3. authenticateAdmin('admin@omegalife.uk', 'admin123')
   → returns admin object
   → returns null for wrong password

4. createTreeForSchool(schoolId, 'apple')
   → creates tree with status='available'
   → verify in Supabase dashboard

5. assignRandomTree(kidId, schoolId)
   → picks random available tree in school
   → tree.status='assigned', tree.current_kid_id=kidId, tree.assigned_at=now()
   → kid.assigned_tree_id=treeId
   → creates care_session
   → returns null if no trees available

6. loadSession(kidId)
   → returns tree + session + chain data
   → returns null for kid with no active session

7. updateTree(treeId, treeState)
   → stats update in database
   → updated_at timestamp changes

8. passOnTree(treeId, sessionId, kidId, treeState, name, message, badges, missions)
   → care_chain entry created
   → session ended
   → tree released to pool (status='available')

9. getCareChain(treeId)
   → returns ordered array of messages
```

### Seed Data Verification

- [ ] Exactly 1 school in `schools` table
- [ ] Exactly 1 admin in `admins` table, linked to correct school
- [ ] Exactly 3 kids in `kids` table, all linked to correct school
- [ ] All password hashes are valid bcrypt (start with `$2b$` or `$2a$`)
- [ ] No trees yet (created via admin in Phase 4-5)

### Build Verification

```bash
npm run build           # Must succeed with 0 errors
npx vite preview        # Must load without Supabase errors in console
```

### Documentation Check

- [ ] `.env.example` documents all required env vars
- [ ] `supabase/schema.sql` has comments explaining each table
- [ ] `supabase/seed.sql` clearly labeled as TEST DATA

## What This Phase Does NOT Do

- No UI changes to App.jsx (that's Phase 2-5)
- No auth flow in the frontend (Phase 2)
- No admin dashboard (Phase 4)
- No Vercel deployment (Phase 7)
- No real calendar day logic (Phase 3)

This phase is purely infrastructure: schema + data layer + credentials.

## Prerequisites (ask user before starting)

1. User must provide Supabase **Project URL** (Settings → API → Project URL)
2. User must provide Supabase **anon public key** (Settings → API → anon key)
3. User confirms school name (default: "Omega Life School")
4. User confirms admin credentials (default: admin@omegalife.uk / admin123)
