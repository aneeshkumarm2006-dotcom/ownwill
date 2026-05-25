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
