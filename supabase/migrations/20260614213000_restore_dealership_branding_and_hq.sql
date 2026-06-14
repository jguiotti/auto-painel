/*
  migration: restore dealership branding + HQ after overly broad demo repair (20260614194000)
  purpose:
    - re-populate theme_config.header_logo_url from dealerships.logo_url when stripped
    - re-populate content_config.hq_address from matriz unit address when missing
  notes: does NOT overwrite existing header_logo_url / hq_address; favicon may need re-upload in admin
*/

update public.dealerships as d
set
  theme_config = d.theme_config || jsonb_build_object('header_logo_url', d.logo_url),
  updated_at = now()
where coalesce(trim(d.theme_config ->> 'header_logo_url'), '') = ''
  and coalesce(trim(d.logo_url), '') <> ''
  and d.logo_url like '%/dealership-branding/%';

update public.dealerships as d
set
  content_config = d.content_config || jsonb_build_object('hq_address', u.address),
  updated_at = now()
from (
  select distinct on (du.dealership_id)
    du.dealership_id,
    du.address
  from public.dealership_units as du
  where du.address is not null
    and du.address <> '{}'::jsonb
  order by du.dealership_id, du.sort_order asc, du.created_at asc
) as u
where d.id = u.dealership_id
  and (
    d.content_config -> 'hq_address' is null
    or d.content_config -> 'hq_address' = 'null'::jsonb
    or d.content_config -> 'hq_address' = '{}'::jsonb
  );
