-- OwnWill — database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query → paste → Run).
-- Idempotent-ish: safe to re-run. Column names match lib/will/data.ts exactly.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  date_of_birth date,
  province text,
  city text,
  address text,
  postal_code text,
  plan text not null default 'none' check (plan in ('none','essentials','premium','premium_x2')),
  plan_purchased_at timestamptz,
  partner_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles.email: backfill from auth.users, then enforce NOT NULL so downstream
-- code (email send, profile self-heal) can stop null-checking.
update public.profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id and (p.email is null or p.email = '');
alter table public.profiles alter column email set not null;

-- profiles.partner_profile_id: linking two spouses shouldn't block deleting
-- one of them. Default FK action is NO ACTION (errors); switch to SET NULL.
alter table public.profiles
  drop constraint if exists profiles_partner_profile_id_fkey;
alter table public.profiles
  add constraint profiles_partner_profile_id_fkey
  foreign key (partner_profile_id) references public.profiles(id) on delete set null;

-- ============================================================
-- provinces (reference)
-- ============================================================
create table if not exists public.provinces (
  code text primary key,
  name text not null,
  name_fr text,
  is_active boolean not null default true,
  supports_electronic_signing boolean not null default false,
  will_template_version text default 'v1',
  poa_health_template_version text default 'v1',
  poa_property_template_version text default 'v1'
);

insert into public.provinces (code, name, supports_electronic_signing) values
  ('ON','Ontario',false),
  ('BC','British Columbia',true),
  ('AB','Alberta',false),
  ('MB','Manitoba',false),
  ('NB','New Brunswick',false),
  ('NL','Newfoundland and Labrador',false),
  ('NS','Nova Scotia',false),
  ('PE','Prince Edward Island',false),
  ('SK','Saskatchewan',false),
  ('QC','Quebec',false)
on conflict (code) do nothing;

-- ============================================================
-- documents (master record)
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('will','poa_health','poa_property','asset_list')),
  province text references public.provinces(code),
  status text not null default 'draft' check (status in ('draft','completed','paid','generated')),
  is_current boolean not null default true,
  version integer not null default 1,
  pdf_url text,
  pdf_generated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_user_type_idx on public.documents (user_id, type, is_current);

-- Demote duplicate "current" documents (keep earliest), then enforce one
-- current document per (user, type) so the wizard never sees duplicates.
with ranked as (
  select id, row_number() over (partition by user_id, type order by created_at) as rn
  from public.documents where is_current
)
update public.documents d set is_current = false
from ranked r where d.id = r.id and r.rn > 1;

create unique index if not exists documents_one_current_per_type
  on public.documents (user_id, type) where is_current;

-- ============================================================
-- will_data  (columns match lib/will/data.ts toRow/fromRow)
-- ============================================================
create table if not exists public.will_data (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  full_legal_name text,
  date_of_birth date,
  province text,
  city text,
  marital_status text,

  executor_first_name text, executor_last_name text, executor_relationship text,
  executor_email text, executor_phone text, executor_city text, executor_province text,

  backup_executor_first_name text, backup_executor_last_name text, backup_executor_relationship text,
  backup_executor_email text, backup_executor_phone text, backup_executor_city text, backup_executor_province text,

  beneficiaries jsonb not null default '[]',
  children jsonb not null default '[]',

  child_guardian_first_name text, child_guardian_last_name text, child_guardian_relationship text,
  child_guardian_email text, child_guardian_phone text, child_guardian_city text, child_guardian_province text,

  backup_guardian_first_name text, backup_guardian_last_name text, backup_guardian_relationship text,
  backup_guardian_email text, backup_guardian_phone text, backup_guardian_city text, backup_guardian_province text,

  pets jsonb not null default '[]',

  pet_guardian_first_name text, pet_guardian_last_name text, pet_guardian_relationship text,
  pet_guardian_email text, pet_guardian_phone text, pet_guardian_city text, pet_guardian_province text,
  pet_care_fund numeric,

  specific_gifts jsonb not null default '[]',
  charitable_donations jsonb not null default '[]',

  funeral_wishes text,
  business_interests text,

  current_step integer not null default 1,
  total_steps integer not null default 9,
  is_complete boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id)
);

-- ============================================================
-- poa_health_data
-- ============================================================
create table if not exists public.poa_health_data (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_legal_name text, date_of_birth date, province text,
  attorney_first_name text, attorney_last_name text, attorney_relationship text,
  attorney_email text, attorney_phone text, attorney_city text, attorney_province text,
  backup_attorney_first_name text, backup_attorney_last_name text, backup_attorney_relationship text,
  backup_attorney_email text, backup_attorney_phone text, backup_attorney_city text, backup_attorney_province text,
  life_support_wishes text,
  organ_donation boolean,
  organ_donation_specifics text, specific_organs text,
  additional_health_wishes text,
  activation_condition text,
  current_step integer not null default 1,
  total_steps integer not null default 1,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id)
);

-- ============================================================
-- poa_property_data
-- ============================================================
create table if not exists public.poa_property_data (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_legal_name text, date_of_birth date, province text,
  attorney_first_name text, attorney_last_name text, attorney_relationship text,
  attorney_email text, attorney_phone text, attorney_city text, attorney_province text,
  backup_attorney_first_name text, backup_attorney_last_name text, backup_attorney_relationship text,
  backup_attorney_email text, backup_attorney_phone text, backup_attorney_city text, backup_attorney_province text,
  manage_bank_accounts boolean, manage_real_estate boolean, manage_investments boolean, manage_taxes boolean,
  make_gifts boolean, gift_limit_per_year numeric,
  additional_powers text, restrictions text,
  activation_condition text,
  requires_two_doctors_confirmation boolean,
  attorney_compensation text,
  compensation_amount numeric,
  current_step integer not null default 1,
  total_steps integer not null default 1,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id)
);

-- ============================================================
-- asset_list_data
-- ============================================================
create table if not exists public.asset_list_data (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  properties jsonb not null default '[]',
  vehicles jsonb not null default '[]',
  bank_accounts jsonb not null default '[]',
  investments jsonb not null default '[]',
  insurance_policies jsonb not null default '[]',
  digital_assets jsonb not null default '[]',
  will_location text, passport_location text, sin_location text,
  other_documents jsonb not null default '[]',
  lawyer_name text, lawyer_phone text,
  accountant_name text, accountant_phone text,
  financial_advisor_name text, financial_advisor_phone text,
  current_step integer not null default 1,
  total_steps integer not null default 1,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id)
);

-- ============================================================
-- payments / email_logs / signing_instructions
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  plan text,
  amount numeric,
  currency text default 'cad',
  status text default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email_type text,
  to_email text, subject text, status text,
  sent_at timestamptz not null default now()
);

create table if not exists public.signing_instructions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  province text, document_type text,
  emailed_at timestamptz not null default now()
);

-- ============================================================
-- Storage bucket for generated PDFs
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- ============================================================
-- Auto-create a profile row when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, province)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'province', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing users created before the trigger.
insert into public.profiles (id, email, full_name, province)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', ''),
       coalesce(u.raw_user_meta_data->>'province', '')
from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.documents           enable row level security;
alter table public.will_data           enable row level security;
alter table public.poa_health_data     enable row level security;
alter table public.poa_property_data   enable row level security;
alter table public.asset_list_data     enable row level security;
alter table public.payments            enable row level security;
alter table public.email_logs          enable row level security;
alter table public.signing_instructions enable row level security;
alter table public.provinces           enable row level security;

-- provinces: public read
drop policy if exists "provinces are readable by everyone" on public.provinces;
create policy "provinces are readable by everyone" on public.provinces for select using (true);

-- profiles: own row
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- Grants — PostgREST roles need table privileges in addition to RLS.
-- Tables created via raw SQL aren't auto-granted like the Table Editor does,
-- which causes 403 "permission denied". RLS still restricts rows; these just
-- let the roles reach the tables.
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select on public.provinces to anon;
grant usage, select on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

-- helper: per-user CRUD policies on a table with a user_id column
do $$
declare t text;
begin
  foreach t in array array[
    'documents','will_data','poa_health_data','poa_property_data',
    'asset_list_data','payments','email_logs','signing_instructions'
  ] loop

    execute format('drop policy if exists "own rows select" on public.%I;', t);
    execute format('create policy "own rows select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows insert" on public.%I;', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows update" on public.%I;', t);
    execute format('create policy "own rows update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows delete" on public.%I;', t);
    execute format('create policy "own rows delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================
-- Additional indexes — every FK that's filtered/ordered in queries.
-- Postgres doesn't auto-index FKs; without these, lookups do seq scans
-- as soon as the tables have any real volume.
-- ============================================================
create index if not exists profiles_partner_profile_id_idx
  on public.profiles (partner_profile_id);

create index if not exists will_data_user_id_idx          on public.will_data (user_id);
create index if not exists poa_health_data_user_id_idx    on public.poa_health_data (user_id);
create index if not exists poa_property_data_user_id_idx  on public.poa_property_data (user_id);
create index if not exists asset_list_data_user_id_idx    on public.asset_list_data (user_id);

create index if not exists payments_user_id_idx           on public.payments (user_id, created_at desc);
create index if not exists email_logs_user_id_idx         on public.email_logs (user_id, sent_at desc);
create index if not exists signing_instructions_user_id_idx
  on public.signing_instructions (user_id, emailed_at desc);
create index if not exists signing_instructions_document_id_idx
  on public.signing_instructions (document_id);

-- ============================================================
-- Storage bucket RLS — the `documents` bucket is public-readable for the
-- generated PDF URL, but writes/updates/deletes must be confined to each
-- user's own folder. Object path convention is `<user_id>/<file>` (see
-- app/api/pdf/route.ts). The service_role bypasses RLS, so the server
-- route still works; these policies block anon/authenticated abuse.
-- ============================================================
drop policy if exists "documents bucket public read" on storage.objects;
create policy "documents bucket public read"
  on storage.objects for select
  using (bucket_id = 'documents');

drop policy if exists "documents bucket owner insert" on storage.objects;
create policy "documents bucket owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "documents bucket owner update" on storage.objects;
create policy "documents bucket owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 1)
  )
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 1)
  );

drop policy if exists "documents bucket owner delete" on storage.objects;
create policy "documents bucket owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = split_part(name, '/', 1)
  );

-- ============================================================
-- Admin: role on profiles + audit log
-- ============================================================
alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer','support','admin','super_admin'));

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}',
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_idx on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log (action, created_at desc);

-- Lock audit log down: only service_role reads/writes (admin server code).
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;

-- ============================================================
-- Admin: document template versions (per type x province)
-- ============================================================
-- Each row is one reviewable version of a legal template body for one
-- (document type, province). The "active" version is what the renderer
-- pulls (once migration is done — currently TS-hardcoded). Lawyers move
-- versions through draft -> in_review -> approved, then activate.
create table if not exists public.document_template_versions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('will','poa_health','poa_property','asset_list')),
  province text not null references public.provinces(code),
  version text not null,
  status text not null default 'draft'
    check (status in ('draft','in_review','approved','retired')),
  body text not null default '',
  change_notes text,
  is_active boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_by_email text,
  approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists doc_template_versions_unique
  on public.document_template_versions (type, province, version);

-- Only one active version per (type, province). Partial unique enforces it.
create unique index if not exists doc_template_versions_active
  on public.document_template_versions (type, province)
  where is_active;

create index if not exists doc_template_versions_updated_idx
  on public.document_template_versions (type, province, updated_at desc);

alter table public.document_template_versions enable row level security;
revoke all on public.document_template_versions from anon, authenticated;

-- ============================================================
-- Admin: app_settings (key-value config)
-- ============================================================
-- Simple kv store for operational settings (support email, disclaimer copy,
-- maintenance mode, etc.) — anything the team needs to change without a deploy.
-- All access via service-role (admin server code).
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

-- Seed defaults so the settings page renders cleanly on first load.
insert into public.app_settings (key, value) values
  ('support_email',     to_jsonb('support@ownwill.ca'::text)),
  ('legal_disclaimer',  to_jsonb('OwnWill is not a law firm and does not provide legal advice. Documents generated through this service are templates only.'::text)),
  ('maintenance_mode',  to_jsonb(false))
on conflict (key) do nothing;

-- ============================================================
-- Pro / B2B: organizations + members + clients + invitations
-- ============================================================
-- A firm (advisor, funeral home, law firm, employer) that uses OwnWill as a
-- product surface for their own clients/employees. All access is gated through
-- server actions using the service-role client; RLS is locked down below.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('advisor','funeral','law','employer','other')),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  -- Branding (Phase 1: logo only; primary_color reserved for Phase 4)
  logo_url text,
  primary_color text,
  -- Billing (populated by Phase 3 Stripe wiring)
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  seat_count integer not null default 1,
  plan text default 'pro_starter' check (plan in ('pro_starter','pro_team','pro_enterprise')),
  -- Compliance / metadata
  licensing_number text,
  address text,
  city text,
  province text references public.provinces(code),
  postal_code text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organizations_type_idx on public.organizations (type);

-- Staff side: which people at the firm have access. Multi-org membership is
-- allowed per Phase 0 decision #8 — no unique constraint on user_id alone; a
-- single user can be a member of several firms. PK enforces one row per
-- (org, user) pair.
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  invited_email text,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists org_members_user_idx on public.organization_members (user_id);

-- Client side: which end-customers a given org manages. Soft revoke per Phase 0
-- decision #7 — revocation flips status to 'revoked' and stamps revoked_at so
-- the audit trail survives. A re-invite creates a new active row (only one
-- active row per (org, user) — see partial unique index below).
create table if not exists public.organization_clients (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('invited','active','revoked')),
  invited_email text,
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists org_clients_user_idx on public.organization_clients (user_id);
create index if not exists org_clients_status_idx on public.organization_clients (organization_id, status);

-- Only one *active* org per client at a time. Lets a client switch firms over
-- time (history preserved via 'revoked' rows) without ambiguity about who is
-- currently managing them.
create unique index if not exists org_clients_one_active
  on public.organization_clients (user_id)
  where status = 'active';

-- Pending invitations: emailed to people before they have an account.
-- `kind` distinguishes staff invites (consumed into organization_members) from
-- client invites (consumed into organization_clients). 14-day expiry default.
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  kind text not null check (kind in ('staff','client')),
  role text check (role in ('owner','admin','member','viewer')),
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists org_invitations_email_idx on public.organization_invitations (lower(email));
create index if not exists org_invitations_org_idx on public.organization_invitations (organization_id, created_at desc);

-- RLS lockdown — all access through server actions using service-role.
-- Customer-side reads (e.g. the "Managed by X" badge on the customer dashboard)
-- also go through server actions, so anon/authenticated never touch these.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_clients enable row level security;
alter table public.organization_invitations enable row level security;
revoke all on public.organizations from anon, authenticated;
revoke all on public.organization_members from anon, authenticated;
revoke all on public.organization_clients from anon, authenticated;
revoke all on public.organization_invitations from anon, authenticated;

-- admin_audit_log is reused for Pro actions; namespace with the 'pro.*' action
-- prefix (pro.org.*, pro.client.*, pro.staff.*, pro.billing.*). No schema
-- change needed here.

-- ------------------------------------------------------------
-- Phase 3 — Billing columns. Added separately so existing rows keep working
-- without backfill; nullable everywhere. `subscription_status` mirrors the
-- Stripe subscription lifecycle so the app can tell "billing not started" from
-- "past due" without re-hitting the API.
alter table public.organizations
  add column if not exists subscription_status text
    check (subscription_status in (
      'incomplete','incomplete_expired','trialing','active',
      'past_due','canceled','unpaid','paused'
    )),
  add column if not exists stripe_price_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create index if not exists organizations_stripe_customer_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;
create index if not exists organizations_stripe_subscription_idx
  on public.organizations (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ------------------------------------------------------------
-- Phase 4 — White-label branding. `logo_path` stores the storage object path
-- inside the private `org-logos` bucket; we mint short-lived signed URLs at
-- send-time rather than persisting public URLs (mirrors the documents-bucket
-- hardening pattern). `logo_url` from the original schema is now deprecated —
-- new code reads/writes `logo_path` only.
alter table public.organizations
  add column if not exists logo_path text;

-- Org-logos bucket: private (signed URLs only). Service-role bypasses RLS, and
-- we intentionally add no anon/authenticated policies — Pro settings actions
-- are the only writer, and signed URLs are the only reader path.
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', false)
on conflict (id) do nothing;

-- ============================================================
-- Phase 5 — Integrations: webhooks + REST API keys
-- ============================================================
-- Outbound webhook endpoints registered by a firm. We POST signed JSON on
-- document lifecycle events (completed / generated). Signing secret is a
-- random 32-byte value stored verbatim; the firm reads it once in /pro/settings
-- and uses it to verify our HMAC-SHA256 header on incoming requests.
create table if not exists public.organization_webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  description text,
  events text[] not null default array['document.completed','document.generated']::text[],
  signing_secret text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  -- Health stats — updated by the dispatcher so the UI can warn on a dead URL.
  last_delivery_at timestamptz,
  last_success_at timestamptz,
  consecutive_failures integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists org_webhooks_org_idx
  on public.organization_webhooks (organization_id, status);

-- Per-attempt audit of webhook fires. Kept compact (status code + truncated
-- response body) so a chatty endpoint doesn't blow up storage. Retries reuse
-- this table — the same (webhook_id, event_id, attempt) tuple is unique.
create table if not exists public.organization_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.organization_webhooks(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  event_type text not null,
  attempt integer not null default 1,
  status text not null check (status in ('success','failed','pending')),
  http_status integer,
  response_excerpt text,
  error text,
  delivered_at timestamptz not null default now(),
  unique (webhook_id, event_id, attempt)
);
create index if not exists org_webhook_deliveries_webhook_idx
  on public.organization_webhook_deliveries (webhook_id, delivered_at desc);
create index if not exists org_webhook_deliveries_org_idx
  on public.organization_webhook_deliveries (organization_id, delivered_at desc);

-- REST API keys. We only persist the SHA-256 hash; the plaintext key is shown
-- once at generation time. `prefix` is the first 8 chars of the plaintext so
-- the UI can render a recognisable label without exposing the secret.
create table if not exists public.organization_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  prefix text not null,
  key_hash text not null,
  scopes text[] not null default array['read']::text[],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists org_api_keys_hash_idx
  on public.organization_api_keys (key_hash);
create index if not exists org_api_keys_org_idx
  on public.organization_api_keys (organization_id, revoked_at);

alter table public.organization_webhooks enable row level security;
alter table public.organization_webhook_deliveries enable row level security;
alter table public.organization_api_keys enable row level security;
revoke all on public.organization_webhooks from anon, authenticated;
revoke all on public.organization_webhook_deliveries from anon, authenticated;
revoke all on public.organization_api_keys from anon, authenticated;
