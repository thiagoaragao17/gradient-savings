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
