/*
  migration: public pricing catalog for marketing-site /planos
  purpose: anon-safe RPC returning active starter/business/enterprise plans and module matrix
  affected: new function public.list_public_pricing_marketing_catalog
*/

create or replace function public.list_public_pricing_marketing_catalog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with marketing_plans as (
    select
      pp.slug,
      pp.name,
      pp.description,
      pp.price_amount,
      pp.currency_code,
      pp.is_active
    from public.pricing_plans as pp
    where pp.slug = any (array['starter'::text, 'business'::text, 'enterprise'::text])
      and pp.is_active = true
    order by
      case pp.slug
        when 'starter' then 1
        when 'business' then 2
        when 'enterprise' then 3
        else 99
      end
  ),
  marketing_modules as (
    select
      sm.key,
      sm.display_name,
      sm.description,
      sm.sort_order,
      coalesce(
        array_agg(mp.slug order by mp.slug) filter (where mp.slug is not null),
        '{}'::text[]
      ) as plan_slugs
    from public.saas_modules as sm
    left join public.pricing_plan_modules as ppm
      on ppm.module_id = sm.id
    left join public.pricing_plans as mp
      on mp.id = ppm.pricing_plan_id
      and mp.slug = any (array['starter'::text, 'business'::text, 'enterprise'::text])
      and mp.is_active = true
    where sm.is_active = true
    group by sm.key, sm.display_name, sm.description, sm.sort_order
    order by sm.sort_order
  )
  select jsonb_build_object(
    'plans',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'slug', mp.slug,
            'name', mp.name,
            'description', mp.description,
            'price_amount', mp.price_amount,
            'currency_code', mp.currency_code
          )
          order by
            case mp.slug
              when 'starter' then 1
              when 'business' then 2
              when 'enterprise' then 3
              else 99
            end
        )
        from marketing_plans as mp
      ),
      '[]'::jsonb
    ),
    'modules',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'key', mm.key,
            'label', mm.display_name,
            'description', coalesce(mm.description, ''),
            'plan_slugs', to_jsonb(mm.plan_slugs)
          )
          order by mm.sort_order
        )
        from marketing_modules as mm
      ),
      '[]'::jsonb
    )
  );
$$;

comment on function public.list_public_pricing_marketing_catalog() is
  'Marketing-site: active starter/business/enterprise plans and module inclusion matrix (anon-safe).';

revoke all on function public.list_public_pricing_marketing_catalog() from public;
grant execute on function public.list_public_pricing_marketing_catalog() to anon, authenticated;
