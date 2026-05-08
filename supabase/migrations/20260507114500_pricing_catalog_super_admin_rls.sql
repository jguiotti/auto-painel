/*
  migration: allow authenticated platform super_admin to manage SaaS pricing catalog via PostgREST (RLS policies).
  notes:
    - admin-master continues to use the service role for mutations; these policies unlock optional browser-JWT tooling.
    - tenant roles (owner/seller) fail the policies and remain blocked.
*/

-- ---------------------------------------------------------------------------
-- saas_modules
-- ---------------------------------------------------------------------------

create policy "saas_modules_select_super_admin"
on public.saas_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "saas_modules_insert_super_admin"
on public.saas_modules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "saas_modules_update_super_admin"
on public.saas_modules
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "saas_modules_delete_super_admin"
on public.saas_modules
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

-- ---------------------------------------------------------------------------
-- pricing_plans
-- ---------------------------------------------------------------------------

create policy "pricing_plans_select_super_admin"
on public.pricing_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plans_insert_super_admin"
on public.pricing_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plans_update_super_admin"
on public.pricing_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plans_delete_super_admin"
on public.pricing_plans
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

-- ---------------------------------------------------------------------------
-- pricing_plan_modules
-- ---------------------------------------------------------------------------

create policy "pricing_plan_modules_select_super_admin"
on public.pricing_plan_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plan_modules_insert_super_admin"
on public.pricing_plan_modules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plan_modules_update_super_admin"
on public.pricing_plan_modules
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);

create policy "pricing_plan_modules_delete_super_admin"
on public.pricing_plan_modules
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles as p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  )
);
