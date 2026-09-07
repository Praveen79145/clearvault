-- ═══════════════════════════════════════════════════════════════════════
--  ClearVault × Supabase — STEP 3 of SUPABASE_SETUP.md
--  Paste this ENTIRE file into Supabase → SQL Editor → "Run"  (once only)
-- ═══════════════════════════════════════════════════════════════════════

-- ── Departments ──────────────────────────────────────────────────────────
create table if not exists departments (
  id   text primary key,                       -- LIBRARY | HOSTELS | SPORTS | ACCOUNTS
  name text not null
);
insert into departments (id, name) values
  ('FINANCE','Finance Office'), ('LIBRARY','Library'), ('HOSTEL','Hostel'),
  ('SPORTS','Sports'), ('PHYSICS_LAB','Physics Lab'), ('CHEMISTRY_LAB','Chemistry Lab'),
  ('DEAN','Dean''s Office'), ('AO','AO Office'), ('DIRECTOR','Director''s Office'),
  -- legacy codes kept resolvable for historical records
  ('ACCOUNTS','Accounts (→ Finance Office)'), ('HOSTELS','Hostels (→ Hostel)')
on conflict (id) do nothing;

-- ── Users (custom auth — we don't use Supabase Auth here) ────────────────
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  roll_no       text,
  role          text not null check (role in ('STUDENT','STAFF','ADMIN')),
  dept          text references departments(id),
  salt          text not null,
  password_hash text not null,
  google_sub    text,                          -- set for Google sign-in accounts
  picture       text,                          -- Google profile photo URL
  created_at    timestamptz not null default now()
);

-- ── Clearance requests ───────────────────────────────────────────────────
create table if not exists clearance_requests (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references profiles(id) on delete cascade,
  purpose             text not null,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  certificate_code    text unique,
  cancelled_at        timestamptz,             -- set once; terminal
  cancelled_by        text,                    -- 'Student' (only self-service cancellation exists)
  cancellation_reason text
);
create index if not exists idx_requests_student on clearance_requests (student_id);

-- ── Per-department decisions ──────────────────────────────────────────────
create table if not exists clearances (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references clearance_requests(id) on delete cascade,
  department_id  text not null references departments(id),
  status         text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  remarks        text,
  approved_by    text,
  signed_at      timestamptz,
  signature_hash text
);
create index if not exists idx_clearances_request on clearances (request_id);
create index if not exists idx_clearances_dept    on clearances (department_id, status);

-- ── Razorpay payment ledger ──────────────────────────────────────────────
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references profiles(id) on delete cascade,
  department_id       text not null references departments(id),
  dues_record_id      text not null,
  amount              numeric(12,2) not null check (amount > 0),
  currency            text not null default 'INR',
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  payment_status      text not null default 'CREATED' check (payment_status in ('CREATED','PAID','FAILED','REFUNDED')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
create index if not exists idx_payments_student on payments(student_id, created_at desc);

-- ── Notifications ─────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  message    text not null,
  type       text not null default 'info' check (type in ('info','success','danger')),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications (user_id, is_read);

-- ── Append-only audit trail ───────────────────────────────────────────────
create table if not exists audit_log (
  id         bigint generated always as identity primary key,
  actor_name text not null,
  action     text not null,
  detail     text,
  created_at timestamptz not null default now()
);

-- ── Row Level Security: hard-deny for everyone ────────────────────────────
-- The Express backend connects with the SERVICE ROLE key, which bypasses RLS.
-- The anon/authenticated roles get no policies at all ⇒ direct browser access
-- to these tables is impossible. Frontend always goes through the Express API.
alter table departments         enable row level security;
alter table profiles            enable row level security;
alter table clearance_requests  enable row level security;
alter table clearances          enable row level security;
alter table notifications       enable row level security;
alter table audit_log           enable row level security;
alter table payments            enable row level security;

-- If you ran an older version of this file, add the Google columns to the
-- EXISTING table instead (safe to run repeatedly):
alter table profiles add column if not exists google_sub text;
alter table profiles add column if not exists picture    text;
alter table profiles add column if not exists disabled   boolean default false;
alter table profiles add column if not exists dues       jsonb;
alter table clearances add column if not exists dues     jsonb;
alter table clearance_requests add column if not exists cancelled_at        timestamptz;
alter table clearance_requests add column if not exists cancelled_by        text;
alter table clearance_requests add column if not exists cancellation_reason text;
