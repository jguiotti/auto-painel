/*
  migration: security advisor hardening v2 (Supabase linter — 2026-06-21)
  purpose:
    - remove broad storage.objects SELECT on public bucket social-carousel-artifacts
      (public buckets serve files by direct URL; listing is unnecessary and exposes keys)
    - explicitly revoke EXECUTE from anon on internal SECURITY DEFINER RPCs that must
      never be callable without a signed-in session (sales squad, panel employees, health audit)
    - revoke REST execute on trigger-only function enforce_internal_dealership_protection
    - lock record_platform_health_ping to service_role only (edge function + cron)
  notes:
    - storefront public RPCs (get_public_vehicle_by_slug, list_public_vehicles_filtered, etc.)
      intentionally remain SECURITY DEFINER + anon — vitrine/marketing depend on them; advisor
      may still warn on those until a future INVOKER+RLS migration.
    - authenticated-only sales RPCs keep EXECUTE for admin-master; bodies enforce is_platform_super_admin().
    - Auth leaked-password protection (HaveIBeenPwned) is enabled in Supabase Dashboard, not SQL.
*/

-- ---------------------------------------------------------------------------
-- 1) storage — public bucket: drop object listing policy
-- ---------------------------------------------------------------------------

drop policy if exists "social_carousel_artifacts_public_read" on storage.objects;

-- ---------------------------------------------------------------------------
-- 2) internal RPCs — explicit deny anon (revoke from public is not always enough)
-- ---------------------------------------------------------------------------

revoke execute on function public.approve_sales_commission_ledger_entries(uuid[]) from anon;
revoke execute on function public.bind_showcase_demo_panel_dealership(uuid) from anon;
revoke execute on function public.clawback_dealership_sales_commissions(uuid) from anon;
revoke execute on function public.confirm_dealership_sales_attribution(uuid) from anon;
revoke execute on function public.generate_monthly_commission_ledger(date) from anon;
revoke execute on function public.generate_payout_batch(date, date) from anon;
revoke execute on function public.get_dealership_sales_ranking(uuid, integer) from anon;
revoke execute on function public.list_dealership_employees_for_panel(uuid) from anon;
revoke execute on function public.mark_payout_batch_paid(uuid) from anon;
revoke execute on function public.provision_attribution_from_signed_contract(uuid, uuid, uuid, boolean) from anon;
revoke execute on function public.transfer_sales_rep_portfolio(uuid, uuid, timestamptz, uuid[], text) from anon;

-- Trigger-only helper — must not appear on /rest/v1/rpc/*
revoke all on function public.enforce_internal_dealership_protection() from anon, authenticated, public;

-- Health audit append — service_role / edge function only
revoke execute on function public.record_platform_health_ping(text, boolean, integer, jsonb) from anon, authenticated, public;
grant execute on function public.record_platform_health_ping(text, boolean, integer, jsonb) to service_role;

notify pgrst, 'reload schema';
