create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  avatar text not null default '',
  role text not null default 'viewer'
    check (role in ('admin', 'sales_manager', 'sales_representative', 'viewer')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists is_active boolean not null default false;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (id, full_name, email, avatar)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  coalesce(email, ''),
  upper(left(coalesce(raw_user_meta_data ->> 'full_name', ''), 2))
from auth.users
on conflict (id) do nothing;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  phone text,
  email text,
  company_size text,
  location text,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Prospect')),
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  job_title text,
  account_id uuid references public.accounts(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lead_id uuid references public.leads(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  value numeric(14, 2) not null default 0 check (value >= 0),
  probability integer not null default 0 check (probability between 0 and 100),
  stage text not null default 'Prospecting'
    check (stage in ('Prospecting', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost')),
  status text not null default 'Open' check (status in ('Open', 'Won', 'Lost')),
  expected_close_date date,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  type text not null check (type in ('Call', 'Email', 'Meeting', 'Note', 'WhatsApp', 'Other', 'LinkedIn', 'Demo')),
  subject text,
  description text not null,
  activity_time timestamptz not null default now(),
  duration integer check (duration is null or duration >= 0),
  outcome text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  type text not null default 'Call' check (type in ('Call', 'Email', 'Meeting', 'Demo', 'Task', 'Other')),
  title text not null,
  description text,
  due_at timestamptz not null,
  status text not null default 'Upcoming'
    check (status in ('Upcoming', 'Today', 'Overdue', 'Completed', 'Cancelled')),
  reminder_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default false,
  trigger_type text not null,
  conditions jsonb not null default '{"match":"all","rules":[]}'::jsonb
    check (jsonb_typeof(conditions) = 'object'),
  actions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(actions) = 'array'),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.automation_rules(id) on delete set null,
  event_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  trigger_type text not null,
  status text not null check (status in ('running', 'success', 'failed', 'skipped')),
  message text,
  executed_at timestamptz not null default now(),
  unique (rule_id, event_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'danger', 'success')),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.leads add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table public.leads add column if not exists account_id uuid references public.accounts(id) on delete set null;
alter table public.leads add column if not exists contact_id uuid references public.contacts(id) on delete set null;
alter table public.leads add column if not exists qualification_details jsonb not null default '{}'::jsonb;
alter table public.leads add column if not exists qualified_at timestamptz;

create index if not exists leads_owner_user_id_idx on public.leads(owner_user_id);
create index if not exists leads_account_id_idx on public.leads(account_id);
create index if not exists leads_contact_id_idx on public.leads(contact_id);
create index if not exists accounts_owner_id_idx on public.accounts(owner_id);
create index if not exists accounts_name_idx on public.accounts(name);
create index if not exists contacts_account_id_idx on public.contacts(account_id);
create index if not exists contacts_lead_id_idx on public.contacts(lead_id);
create index if not exists contacts_owner_id_idx on public.contacts(owner_id);
create index if not exists opportunities_lead_id_idx on public.opportunities(lead_id);
create index if not exists opportunities_account_id_idx on public.opportunities(account_id);
create index if not exists opportunities_contact_id_idx on public.opportunities(contact_id);
create index if not exists opportunities_owner_id_idx on public.opportunities(owner_id);
create index if not exists opportunities_stage_idx on public.opportunities(stage);
create index if not exists activities_lead_time_idx on public.activities(lead_id, activity_time desc);
create index if not exists follow_ups_due_status_idx on public.follow_ups(due_at, status);
create index if not exists follow_ups_assigned_due_idx on public.follow_ups(assigned_to, due_at);
create index if not exists automation_rules_trigger_idx on public.automation_rules(trigger_type, active);
create index if not exists automation_logs_entity_idx on public.automation_logs(entity_type, entity_id, executed_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.current_crm_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.can_access_crm_record(record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.current_crm_role()
    when 'admin' then true
    when 'sales_manager' then true
    when 'viewer' then true
    when 'sales_representative' then record_owner = auth.uid()
    else false
  end
$$;

create or replace function public.can_write_crm_record(record_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.current_crm_role()
    when 'admin' then true
    when 'sales_manager' then true
    when 'sales_representative' then record_owner = auth.uid()
    else false
  end
$$;

create or replace function public.set_crm_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'accounts', 'contacts', 'opportunities', 'follow_ups', 'automation_rules'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_crm_updated_at()', table_name);
  end loop;
end $$;

create or replace function public.write_crm_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_id_value uuid;
  action_value text;
begin
  entity_id_value := coalesce(new.id, old.id);
  action_value := lower(tg_op);
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    tg_table_name || '.' || action_value,
    tg_table_name,
    entity_id_value,
    jsonb_build_object(
      'before', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      'after', case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
    )
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'leads', 'accounts', 'contacts', 'opportunities', 'activities', 'follow_ups'] loop
    execute format('drop trigger if exists write_audit_log on public.%I', table_name);
    execute format('create trigger write_audit_log after insert or update or delete on public.%I for each row execute function public.write_crm_audit_log()', table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.follow_ups enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Leadwise development select leads" on public.leads;
drop policy if exists "Leadwise development insert leads" on public.leads;
drop policy if exists "Leadwise development update leads" on public.leads;
drop policy if exists "Leadwise development delete leads" on public.leads;

do $$
declare
  table_name text;
  owner_column text;
begin
  foreach table_name in array array['leads', 'accounts', 'contacts', 'opportunities', 'activities', 'follow_ups', 'automation_rules'] loop
    owner_column := case table_name
      when 'leads' then 'owner_user_id'
      when 'activities' then 'created_by'
      when 'automation_rules' then 'created_by'
      when 'follow_ups' then 'assigned_to'
      else 'owner_id'
    end;
    execute format('drop policy if exists crm_read_policy on public.%I', table_name);
    execute format('drop policy if exists crm_insert_policy on public.%I', table_name);
    execute format('drop policy if exists crm_update_policy on public.%I', table_name);
    execute format('drop policy if exists crm_delete_policy on public.%I', table_name);
    execute format('create policy crm_read_policy on public.%I for select to authenticated using (public.can_access_crm_record(%I))', table_name, owner_column);
    execute format('create policy crm_insert_policy on public.%I for insert to authenticated with check (public.can_write_crm_record(%I))', table_name, owner_column);
    execute format('create policy crm_update_policy on public.%I for update to authenticated using (public.can_write_crm_record(%I)) with check (public.can_write_crm_record(%I))', table_name, owner_column, owner_column);
    execute format('create policy crm_delete_policy on public.%I for delete to authenticated using (public.can_write_crm_record(%I))', table_name, owner_column);
  end loop;
end $$;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_crm_role() in ('admin', 'sales_manager'));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and is_active and role = public.current_crm_role());
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.current_crm_role() = 'admin')
with check (public.current_crm_role() = 'admin');

drop policy if exists automation_rules_insert_manager on public.automation_rules;
drop policy if exists crm_insert_policy on public.automation_rules;
create policy automation_rules_insert_manager on public.automation_rules
for insert to authenticated
with check (public.current_crm_role() in ('admin', 'sales_manager'));
drop policy if exists automation_rules_update_manager on public.automation_rules;
drop policy if exists crm_update_policy on public.automation_rules;
create policy automation_rules_update_manager on public.automation_rules
for update to authenticated
using (public.current_crm_role() in ('admin', 'sales_manager'))
with check (public.current_crm_role() in ('admin', 'sales_manager'));
drop policy if exists automation_rules_delete_manager on public.automation_rules;
drop policy if exists crm_delete_policy on public.automation_rules;
create policy automation_rules_delete_manager on public.automation_rules
for delete to authenticated using (public.current_crm_role() in ('admin', 'sales_manager'));

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_insert_authorized on public.notifications;
create policy notifications_insert_authorized on public.notifications
for insert to authenticated with check (public.current_crm_role() in ('admin', 'sales_manager', 'sales_representative'));

drop policy if exists automation_logs_read_authorized on public.automation_logs;
create policy automation_logs_read_authorized on public.automation_logs
for select to authenticated using (public.current_crm_role() in ('admin', 'sales_manager', 'viewer'));

drop policy if exists audit_logs_read_authorized on public.audit_logs;
create policy audit_logs_read_authorized on public.audit_logs
for select to authenticated using (public.current_crm_role() in ('admin', 'sales_manager', 'viewer'));

revoke all on public.profiles, public.leads, public.accounts, public.contacts, public.opportunities,
  public.activities, public.follow_ups, public.automation_rules, public.automation_logs,
  public.notifications, public.audit_logs from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.leads, public.accounts, public.contacts,
  public.opportunities, public.activities, public.follow_ups, public.automation_rules to authenticated;
grant select on public.automation_logs, public.audit_logs to authenticated;
grant select, insert, update on public.notifications to authenticated;
grant execute on function public.current_crm_role() to authenticated;
grant execute on function public.can_access_crm_record(uuid) to authenticated;
grant execute on function public.can_write_crm_record(uuid) to authenticated;

notify pgrst, 'reload schema';
