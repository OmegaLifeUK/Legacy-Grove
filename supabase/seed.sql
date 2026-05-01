-- ============================================================================
-- Legacy Grove — Seed Data (TEST ONLY)
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- Passwords here are for development/testing only
-- ============================================================================

-- Seed school
insert into schools (name, code) values ('Omega Life School', 'OMEGA2026');

-- Seed admin (password: admin123)
insert into admins (school_id, email, password_hash, display_name, role)
select id, 'admin@omegalife.uk', hash_password('admin123'), 'Mr. Carter', 'super_admin'
from schools where code = 'OMEGA2026';

-- Seed test kids (password: tree123 for all)
insert into kids (school_id, name, username, password_hash)
select s.id, 'Alex Johnson', 'alex', hash_password('tree123')
from schools s where s.code = 'OMEGA2026';

insert into kids (school_id, name, username, password_hash)
select s.id, 'Bella Khan', 'bella', hash_password('tree123')
from schools s where s.code = 'OMEGA2026';

insert into kids (school_id, name, username, password_hash)
select s.id, 'Charlie Davis', 'charlie', hash_password('tree123')
from schools s where s.code = 'OMEGA2026';
