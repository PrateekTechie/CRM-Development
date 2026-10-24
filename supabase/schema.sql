create table if not exists public.leads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text,
    phone text,
    job_title text,
    company text,
    industry text,
    website text,
    source text,
    owner text,
    status text default 'New',
    stage text default 'Prospecting',
    priority text default 'Medium',
    score integer default 0,
    product_interest text,
    expected_value numeric(12,2) default 0,
    expected_close_date date,
    quotation_value numeric(12,2),
    quotation_status text check (quotation_status in ('Not Sent', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired')),
    quotation_attachment_path text,
    quotation_attachment_name text,
    quotation_attachment_size bigint,
    quotation_attachment_type text,
    quotation_uploaded_at timestamptz,
    next_follow_up timestamptz,
    preferred_contact_method text,
    notes text,
    tags text[] default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    owner_id text,
    company_size text,
    location text,
    requirement text,
    next_follow_up_time text,
    next_follow_up_note text,
    last_activity_date date
);

alter table public.leads add column if not exists name text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists job_title text;
alter table public.leads add column if not exists company text;
alter table public.leads add column if not exists industry text;
alter table public.leads add column if not exists website text;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists owner text;
alter table public.leads add column if not exists owner_id text;
alter table public.leads add column if not exists status text default 'New';
alter table public.leads add column if not exists stage text default 'Prospecting';
alter table public.leads add column if not exists priority text default 'Medium';
alter table public.leads add column if not exists score integer default 0;
alter table public.leads add column if not exists product_interest text;
alter table public.leads add column if not exists expected_value numeric(12,2) default 0;
alter table public.leads add column if not exists expected_close_date date;
alter table public.leads add column if not exists quotation_value numeric(12,2);
alter table public.leads add column if not exists quotation_status text check (quotation_status in ('Not Sent', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired'));
alter table public.leads add column if not exists quotation_attachment_path text;
alter table public.leads add column if not exists quotation_attachment_name text;
alter table public.leads add column if not exists quotation_attachment_size bigint;
alter table public.leads add column if not exists quotation_attachment_type text;
alter table public.leads add column if not exists quotation_uploaded_at timestamptz;
alter table public.leads add column if not exists next_follow_up timestamptz;
alter table public.leads add column if not exists next_follow_up_time text;
alter table public.leads add column if not exists next_follow_up_note text;
alter table public.leads add column if not exists preferred_contact_method text;
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists requirement text;
alter table public.leads add column if not exists tags text[] default '{}';
alter table public.leads add column if not exists company_size text;
alter table public.leads add column if not exists location text;
alter table public.leads add column if not exists last_activity_date date;
alter table public.leads add column if not exists created_at timestamptz not null default now();
alter table public.leads add column if not exists updated_at timestamptz not null default now();

create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_phone_idx on public.leads(phone);
create index if not exists leads_company_idx on public.leads(company);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_owner_idx on public.leads(owner);

alter table public.leads enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on table public.leads to anon;

-- Development-only policies: the current CRM has no Supabase Auth session.
-- Replace these public anon policies with authenticated-user policies before production.
drop policy if exists "Leadwise development select leads" on public.leads;
drop policy if exists "Leadwise development insert leads" on public.leads;
drop policy if exists "Leadwise development update leads" on public.leads;
drop policy if exists "Leadwise development delete leads" on public.leads;

create policy "Leadwise development select leads"
on public.leads for select to anon using (true);

create policy "Leadwise development insert leads"
on public.leads for insert to anon with check (true);

create policy "Leadwise development update leads"
on public.leads for update to anon using (true) with check (true);

create policy "Leadwise development delete leads"
on public.leads for delete to anon using (true);

create or replace function public.set_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_leads_updated_at();
