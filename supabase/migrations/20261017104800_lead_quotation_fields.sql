do $$
begin
  if to_regclass('public.leads') is null then
    raise exception 'Quotation migration requires public.leads to exist.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'owner_user_id'
  ) then
    raise exception 'Quotation migration requires public.leads.owner_user_id; review the production CRM schema before applying.';
  end if;

  if to_regprocedure('public.can_access_crm_record(uuid)') is null
     or to_regprocedure('public.can_write_crm_record(uuid)') is null then
    raise exception 'Quotation migration requires the CRM record authorization functions; review the production CRM schema before applying.';
  end if;

  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'Quotation migration requires Supabase Storage to be enabled.';
  end if;
end $$;

alter table public.leads add column if not exists quotation_value numeric(12,2);
alter table public.leads add column if not exists quotation_status text;
alter table public.leads add column if not exists quotation_attachment_path text;
alter table public.leads add column if not exists quotation_attachment_name text;
alter table public.leads add column if not exists quotation_attachment_size bigint;
alter table public.leads add column if not exists quotation_attachment_type text;
alter table public.leads add column if not exists quotation_uploaded_at timestamptz;
alter table public.leads alter column quotation_status set default 'Not Sent';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_quotation_value_nonnegative'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_quotation_value_nonnegative
      check (quotation_value is null or quotation_value >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_quotation_status_valid'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_quotation_status_valid
      check (
        quotation_status is null
        or quotation_status in ('Not Sent', 'Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected', 'Expired')
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_quotation_attachment_path_owner'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_quotation_attachment_path_owner
      check (
        quotation_attachment_path is null
        or (
          split_part(quotation_attachment_path, '/', 1) = id::text
          and split_part(quotation_attachment_path, '/', 2) <> ''
        )
      );
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-quotations',
  'lead-quotations',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "CRM quotation files select" on storage.objects;
create policy "CRM quotation files select"
on storage.objects for select to authenticated
using (
  bucket_id = 'lead-quotations'
  and exists (
    select 1
    from public.leads lead_record
    where lead_record.id::text = (storage.foldername(storage.objects.name))[1]
      and public.can_access_crm_record(lead_record.owner_user_id)
  )
);

drop policy if exists "CRM quotation files insert" on storage.objects;
create policy "CRM quotation files insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lead-quotations'
  and exists (
    select 1
    from public.leads lead_record
    where lead_record.id::text = (storage.foldername(storage.objects.name))[1]
      and public.can_write_crm_record(lead_record.owner_user_id)
  )
);

drop policy if exists "CRM quotation files update" on storage.objects;
create policy "CRM quotation files update"
on storage.objects for update to authenticated
using (
  bucket_id = 'lead-quotations'
  and exists (
    select 1
    from public.leads lead_record
    where lead_record.id::text = (storage.foldername(storage.objects.name))[1]
      and public.can_write_crm_record(lead_record.owner_user_id)
  )
)
with check (
  bucket_id = 'lead-quotations'
  and exists (
    select 1
    from public.leads lead_record
    where lead_record.id::text = (storage.foldername(storage.objects.name))[1]
      and public.can_write_crm_record(lead_record.owner_user_id)
  )
);

drop policy if exists "CRM quotation files delete" on storage.objects;
create policy "CRM quotation files delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'lead-quotations'
  and exists (
    select 1
    from public.leads lead_record
    where lead_record.id::text = (storage.foldername(storage.objects.name))[1]
      and public.can_write_crm_record(lead_record.owner_user_id)
  )
);

notify pgrst, 'reload schema';
