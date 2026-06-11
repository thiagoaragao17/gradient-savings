-- ─────────────────────────────────────────────────────────────
-- Gradient Payments — Database Schema
-- Paste this into the Supabase SQL Editor and click Run
-- ─────────────────────────────────────────────────────────────

create table if not exists prospects (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null,
  company_name            text not null,
  company_address         text,
  statement_date          text not null,
  current_provider        text not null,
  total_volume            numeric not null default 0,
  total_transactions      integer not null default 0,
  processing_in_person_pct integer not null default 0,
  processing_keyed_pct    integer not null default 100,
  card_consumer_pct       integer not null default 0,
  card_premium_pct        integer not null default 0,
  card_corporate_pct      integer not null default 0,
  current_monthly_cost    numeric not null default 0,
  new_monthly_cost        numeric not null default 0,
  current_effective_rate  numeric not null default 0,
  new_effective_rate      numeric not null default 0,
  monthly_savings         numeric not null default 0,
  annual_savings          numeric not null default 0,
  helcim_tier             integer not null default 2,
  helcim_comparison_number integer,
  helcim_link             text,
  signup_url              text,
  interchange_data        jsonb not null default '{}',
  expiry_date             date not null,
  status                  text not null default 'active'
                            check (status in ('active', 'expired', 'inactive')),
  created_at              timestamptz not null default now(),
  view_count              integer not null default 0,
  first_viewed_at         timestamptz,
  last_viewed_at          timestamptz,
  rep_name                text,
  rep_email               text,
  rep_phone               text
);

create table if not exists prospect_views (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references prospects(id) on delete cascade,
  viewed_at     timestamptz not null default now()
);

create index if not exists idx_prospects_slug       on prospects(slug);
create index if not exists idx_prospects_status     on prospects(status);
create index if not exists idx_views_prospect_id    on prospect_views(prospect_id);

create table if not exists audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_name   text not null,
  action       text not null,
  target_label text not null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  password_hash text not null,
  role          text not null default 'admin' check (role in ('admin', 'viewer')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists admin_sessions (
  token       text primary key,
  user_id     uuid not null references admin_users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on admin_sessions(user_id);
create index if not exists idx_sessions_expires  on admin_sessions(expires_at);

create table if not exists app_settings (
  id                    integer primary key default 1,
  rep_name              text not null default 'Colin Knox',
  rep_email             text not null default 'colin.knox@meetgradient.com',
  default_expiry_days   integer not null default 90,
  signup_url_template   text,
  constraint single_row check (id = 1)
);
insert into app_settings (id) values (1) on conflict do nothing;
