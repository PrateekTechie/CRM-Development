# Supabase setup

The application uses Supabase Auth, PostgreSQL, and Row Level Security. Database changes and Edge Function deployment are operator actions; they are not run by the frontend build.

## 1. Configure the application

Set these client-side variables in the deployment environment (or a local `.env` file):

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Never expose the service-role key through a `VITE_` variable.

## Supabase Auth redirect configuration

In Supabase Dashboard, open **Authentication > URL Configuration** and add the exact application origin with a trailing slash to **Redirect URLs** for each environment. The app sends email confirmations to `${window.location.origin}/`, so local development and production must each be allowlisted using the origin actually serving the app. Set **Site URL** to the canonical production origin.

Keep email confirmation enabled. The default confirmation email template should continue to use `{{ .ConfirmationURL }}`; no email template is stored in this repository.

## 2. Apply the database schema

If `public.leads` does not exist, run [`schema.sql`](./schema.sql) in the Supabase SQL Editor and immediately run [`migrations/20261007170000_crm_production_schema.sql`](./migrations/20261007170000_crm_production_schema.sql). If the existing Leads schema is already installed, run only the production migration.

The base `schema.sql` contains development-only anonymous Leads policies. Do not deploy or leave the project in that state; the production migration replaces those policies with authenticated role-based policies.

## 3. Provision the first administrator

Register the initial administrator account through the app and complete email confirmation if enabled. Then, in the trusted Supabase SQL Editor, activate that account using its registered email:

```sql
update public.profiles
set role = 'admin', is_active = true
where lower(email) = lower('admin@example.com');
```

Confirm that exactly one profile was updated before continuing. New registrations are inactive and cannot read CRM records until an administrator enables them. Active administrators can enable additional users and assign roles from Settings.

## 4. Optional automation Edge Function

Automation is not active until the function is deployed. Configure the function's `SUPABASE_SERVICE_ROLE_KEY` as a server-side Edge Function secret in Supabase; never put it in browser environment variables. Then deploy from the repository root with the Supabase CLI:

```text
supabase functions deploy process-automation --project-ref <project-ref>
```

The CRM currently sends event-triggered invocations for supported create/update actions. Follow-up due/overdue rules do not have a scheduled job, and email/call providers are not integrated.

## Deployment status

This repository change adds the migration and function source only. It does not apply SQL to a Supabase project, configure Auth email settings, deploy the Edge Function, or provision any external provider.
