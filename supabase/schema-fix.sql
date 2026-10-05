-- Run this migration in Supabase Dashboard > SQL Editor.
-- It is safe to run repeatedly and only adds columns used by the Leadwise
-- Leads insert, update, and returned-row mapping.

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

notify pgrst, 'reload schema';
