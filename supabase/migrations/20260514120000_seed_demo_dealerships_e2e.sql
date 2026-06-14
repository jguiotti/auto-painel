/*
  migration: demo seed for end-to-end storefront + panel validation (3 dealerships)
  affected: public.dealerships, public.dealership_units, public.vehicles
  notes:
    - idempotent upsert by slug / (dealership_id, public_slug)
    - auth users are provisioned separately via scripts/seed-demo-dealership-users.mjs
*/

-- ---------------------------------------------------------------------------
-- helper: resolve enterprise pricing plan
-- ---------------------------------------------------------------------------
with enterprise_plan as (
  select id
  from public.pricing_plans
  where slug = 'enterprise'
  limit 1
),
seed_dealerships as (
  insert into public.dealerships (
    id,
    name,
    slug,
    logo_url,
    whatsapp_number,
    contact_email,
    status,
    layout_id,
    pricing_plan_id,
    theme_settings,
    theme_config,
    content_config
  )
  select
    v.id,
    v.name,
    v.slug,
    v.logo_url,
    v.whatsapp_number,
    v.contact_email,
    'active'::text,
    v.layout_id,
    (select id from enterprise_plan),
    v.theme_settings::jsonb,
    v.theme_config::jsonb,
    v.content_config::jsonb
  from (
    values
      (
        '11111111-1111-4111-8111-111111111101'::uuid,
        'Guiotti Multimarcas',
        'guiotti',
        'https://placehold.co/400x120/1a1a1a/C5A059?text=Guiotti+Multimarcas',
        '5511999990001',
        'contato@guiotti.demo',
        1::smallint,
        '{"primary":"#C5A059","accent":"#E9C176","storefront_theme_mode":"dark"}'::jsonb,
        '{
          "primary_color": "#C5A059",
          "secondary_color": "#E9C176",
          "storefront_theme_mode": "dark",
          "font_pair_id": "serif_editorial",
          "google_font_heading": "Noto Serif",
          "google_font_body": "Manrope"
        }'::jsonb,
        '{
          "about_text": "Curadoria premium de superesportivos e multimarcas de luxo.",
          "hq_address": "Av. Paulista, 1000 — São Paulo, SP"
        }'::jsonb
      ),
      (
        '11111111-1111-4111-8111-111111111102'::uuid,
        'AutoPrime Motors',
        'autoprime',
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=120&fit=crop',
        '5511999990002',
        'contato@autoprime.demo',
        2::smallint,
        '{"primary":"#7F1D1D","accent":"#B91C1C","storefront_theme_mode":"dark"}'::jsonb,
        '{
          "primary_color": "#7F1D1D",
          "secondary_color": "#B91C1C",
          "storefront_theme_mode": "dark",
          "font_pair_id": "serif_editorial",
          "google_font_heading": "Noto Serif",
          "google_font_body": "Manrope"
        }'::jsonb,
        '{
          "about_text": "Performance e tradição automotiva com atendimento consultivo.",
          "hq_address": "Rod. dos Bandeirantes, 500 — Campinas, SP"
        }'::jsonb
      ),
      (
        '11111111-1111-4111-8111-111111111103'::uuid,
        'EcoDrive Seminovos',
        'ecodrive',
        'https://placehold.co/400x120/2563EB/ffffff?text=EcoDrive',
        '5511999990003',
        'contato@ecodrive.demo',
        3::smallint,
        '{"primary":"#2563EB","accent":"#38BDF8","storefront_theme_mode":"dark"}'::jsonb,
        '{
          "primary_color": "#2563EB",
          "secondary_color": "#38BDF8",
          "storefront_theme_mode": "dark",
          "font_pair_id": "sans_geometric",
          "google_font_heading": "Manrope",
          "google_font_body": "Manrope"
        }'::jsonb,
        '{
          "about_text": "Seminovos selecionados com foco em eficiência e mobilidade sustentável.",
          "hq_address": "Rua Verde, 250 — Curitiba, PR"
        }'::jsonb
      )
  ) as v(
    id,
    name,
    slug,
    logo_url,
    whatsapp_number,
    contact_email,
    layout_id,
    theme_settings,
    theme_config,
    content_config
  )
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.dealership_units (dealership_id, name)
select sd.id, 'Matriz'
from seed_dealerships as sd
where not exists (
  select 1
  from public.dealership_units as u
  where u.dealership_id = sd.id
);

-- ensure matriz exists for seeded dealerships (legacy rows may already exist)
insert into public.dealership_units (dealership_id, name)
select d.id, 'Matriz'
from public.dealerships as d
where d.slug in ('guiotti', 'autoprime', 'ecodrive')
  and not exists (
    select 1
    from public.dealership_units as u
    where u.dealership_id = d.id
  );

-- ---------------------------------------------------------------------------
-- vehicles (5+ per dealership, idempotent by slug)
-- ---------------------------------------------------------------------------
delete from public.vehicles as v
using public.dealerships as d
where v.dealership_id = d.id
  and d.slug in ('guiotti', 'autoprime', 'ecodrive')
  and v.public_slug like 'demo-%';

insert into public.vehicles (
  dealership_id,
  dealership_unit_id,
  brand,
  model,
  manufacturing_year,
  model_year,
  mileage,
  price,
  sale_price,
  images,
  description,
  status,
  public_slug,
  vehicle_type,
  is_featured,
  is_active
)
select
  d.id,
  u.id,
  v.brand,
  v.model,
  v.manufacturing_year,
  v.model_year,
  v.mileage,
  v.price,
  v.price,
  v.images,
  v.description,
  'available',
  v.public_slug,
  'automovel',
  v.is_featured,
  true
from public.dealerships as d
inner join lateral (
  select du.id
  from public.dealership_units as du
  where du.dealership_id = d.id
  order by du.sort_order asc, du.created_at asc
  limit 1
) as u on true
inner join (
  values
    -- guiotti (layout 1 — gold premium)
    ('guiotti', 'Ferrari', 'F8 Tributo', 2022, 2022, 1200, 3850000.00, 'demo-ferrari-f8', true,
      array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?w=1200']::text[],
      'Superesportivo V8 biturbo com pacote exclusivo.'),
    ('guiotti', 'Porsche', '911 Carrera S', 2021, 2022, 8900, 1150000.00, 'demo-porsche-911', true,
      array['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200']::text[],
      'Esportivo icônico com histórico de revisões.'),
    ('guiotti', 'Porsche', '911 Turbo S', 2024, 2024, 0, 2490000.00, 'demo-porsche-turbo', false,
      array['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200']::text[],
      'Zero km, configuração premium.'),
    ('guiotti', 'Lamborghini', 'Urus', 2022, 2023, 5400, 3100000.00, 'demo-lamborghini-urus', false,
      array['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200']::text[],
      'SUV performance com interior alcantara.'),
    ('guiotti', 'BMW', 'M4 Competition', 2023, 2023, 3200, 890000.00, 'demo-bmw-m4', false,
      array['https://images.unsplash.com/photo-1555215695-3004980adade?w=1200']::text[],
      'Cupê M com pacote carbono.'),
    ('guiotti', 'Mercedes-Benz', 'AMG GT', 2021, 2021, 7600, 980000.00, 'demo-amg-gt', false,
      array['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200']::text[],
      'Grand tourer com acabamento impecável.'),

    -- autoprime (layout 2 — dark red)
    ('autoprime', 'Chevrolet', 'Camaro SS', 2020, 2020, 18000, 320000.00, 'demo-camaro-ss', true,
      array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200']::text[],
      'Muscle car V8 com histórico completo.'),
    ('autoprime', 'Ford', 'Mustang GT', 2021, 2021, 14500, 295000.00, 'demo-mustang-gt', true,
      array['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200']::text[],
      'Performance americana com interior premium.'),
    ('autoprime', 'Jeep', 'Grand Cherokee SRT', 2019, 2020, 42000, 265000.00, 'demo-jeep-srt', false,
      array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200']::text[],
      'SUV esportivo 475 cv.'),
    ('autoprime', 'Dodge', 'Challenger R/T', 2018, 2019, 51000, 210000.00, 'demo-challenger-rt', false,
      array['https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200']::text[],
      'Clássico moderno bem conservado.'),
    ('autoprime', 'Toyota', 'Supra GR', 2022, 2022, 9800, 520000.00, 'demo-supra-gr', false,
      array['https://images.unsplash.com/photo-1621135802923-43ca888a1c22?w=1200']::text[],
      'Esportivo japonês com baixa quilometragem.'),
    ('autoprime', 'Audi', 'RS5 Sportback', 2021, 2021, 22000, 430000.00, 'demo-audi-rs5', false,
      array['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200']::text[],
      'Performance alemã com tração quattro.'),

    -- ecodrive (layout 3 — electric blue)
    ('ecodrive', 'BYD', 'Dolphin', 2023, 2024, 8000, 149900.00, 'demo-byd-dolphin', true,
      array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?w=1200']::text[],
      'Elétrico urbano com autonomia estendida.'),
    ('ecodrive', 'Volkswagen', 'ID.4', 2022, 2023, 21000, 189900.00, 'demo-vw-id4', true,
      array['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200']::text[],
      'SUV elétrico com pacote tech.'),
    ('ecodrive', 'Hyundai', 'Kona Electric', 2021, 2022, 34000, 129900.00, 'demo-kona-ev', false,
      array['https://images.unsplash.com/photo-1619767886555-ef069784966c?w=1200']::text[],
      'Compacto elétrico ideal para cidade.'),
    ('ecodrive', 'Toyota', 'Corolla Hybrid', 2022, 2023, 28000, 139900.00, 'demo-corolla-hybrid', false,
      array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?w=1200']::text[],
      'Híbrido econômico e confiável.'),
    ('ecodrive', 'Honda', 'City Touring', 2021, 2022, 36000, 98900.00, 'demo-honda-city', false,
      array['https://images.unsplash.com/photo-1609521263047-f8f205293bb4?w=1200']::text[],
      'Sedan eficiente com baixo custo.'),
    ('ecodrive', 'Renault', 'Kwid Intense', 2020, 2021, 48000, 54900.00, 'demo-renault-kwid', false,
      array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200']::text[],
      'Entrada acessível para mobilidade urbana.')
) as v(
  dealership_slug,
  brand,
  model,
  manufacturing_year,
  model_year,
  mileage,
  price,
  public_slug,
  is_featured,
  images,
  description
) on d.slug = v.dealership_slug
on conflict (dealership_id, public_slug) do update set
  brand = excluded.brand,
  model = excluded.model,
  manufacturing_year = excluded.manufacturing_year,
  model_year = excluded.model_year,
  mileage = excluded.mileage,
  price = excluded.price,
  sale_price = excluded.sale_price,
  images = excluded.images,
  description = excluded.description,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  updated_at = now();
