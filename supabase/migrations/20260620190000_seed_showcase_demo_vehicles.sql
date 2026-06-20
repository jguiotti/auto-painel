/*
  migration: showcase demo vehicle catalog (marketing vitrines)
  purpose:
    - seed 20+ vehicles per public demo storefront (demo-2, demo-3, demo)
    - multiple images per vehicle for storefront gallery carousel
    - align demo slug layout_id with marketing showcase (demo = layout 3)
  affected: public.dealerships, public.vehicles
  notes: idempotent by (dealership_id, public_slug); re-run refreshes demo stock
*/

-- ensure marketing demo slugs exist with expected layouts
with enterprise_plan as (
  select id from public.pricing_plans where slug = 'enterprise' limit 1
)
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
values
  (
    'fbb83941-99e0-48e4-a5ec-e5cdaa66c635'::uuid,
    'Demo 2',
    'demo-2',
    'https://placehold.co/480x120/18181b/dc2626?text=Demo+2&font=montserrat',
    '5511999887701',
    'contato@autopainel.com.br',
    'active',
    1::smallint,
    (select id from enterprise_plan),
    '{"primary":"#dc2626","accent":"#fafafa","storefront_theme_mode":"dark"}'::jsonb,
    '{"primary_color":"#dc2626","secondary_color":"#fafafa","storefront_theme_mode":"dark","font_pair_id":"serif_editorial","google_font_heading":"Noto Serif","google_font_body":"Manrope"}'::jsonb,
    '{"about_text":"Vitrine demo layout Premium — estoque fictício para demonstração AutoPainel."}'::jsonb
  ),
  (
    '628392cf-1d28-4142-a43d-a79afd8f9c2c'::uuid,
    'Demo 3',
    'demo-3',
    'https://placehold.co/480x120/0f172a/0d9488?text=Demo+3&font=montserrat',
    '5511999887702',
    'contato@autopainel.com.br',
    'active',
    2::smallint,
    (select id from enterprise_plan),
    '{"primary":"#0d9488","accent":"#14b8a6","storefront_theme_mode":"dark"}'::jsonb,
    '{"primary_color":"#0d9488","secondary_color":"#14b8a6","storefront_theme_mode":"dark","font_pair_id":"serif_editorial","google_font_heading":"Noto Serif","google_font_body":"Manrope","sells_motorcycles":true}'::jsonb,
    '{"about_text":"Vitrine demo layout Clássico — automóveis e motocicletas fictícios para demonstração.","storefront_home":{"by_layout":{"2":{"hero_eyebrow":"Ambiente de demonstração","hero_headline":"Automóveis e motocicletas com quem entende do mercado.","hero_subheadline":"Seleção esportiva e atendimento consultivo — dados fictícios para preview do AutoPainel."}}}}'::jsonb
  )
on conflict (slug) do update set
  layout_id = excluded.layout_id,
  status = excluded.status,
  updated_at = now();

update public.dealerships
set layout_id = 3::smallint, updated_at = now()
where slug = 'demo'
  and layout_id is distinct from 3;

insert into public.dealership_units (dealership_id, name, sort_order)
select d.id, 'Matriz', 0
from public.dealerships as d
where d.slug in ('demo', 'demo-2', 'demo-3')
  and not exists (
    select 1 from public.dealership_units as du where du.dealership_id = d.id
  );

delete from public.vehicles as v
using public.dealerships as d
where v.dealership_id = d.id
  and d.slug in ('demo', 'demo-2', 'demo-3')
  and (
    v.public_slug like 'showcase-%'
    or v.public_slug like 'demo-%'
  );

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
  v.vehicle_type,
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
    ('demo-2', 'Ferrari', 'F8 Tributo', 2022, 2022, 1200, 3850000.00, 'showcase-ferrari-f8-tributo', true, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Superesportivo V8 biturbo com histórico de revisões na concessionária.', 'automovel'),
    ('demo-2', 'Porsche', '911 Carrera S', 2021, 2022, 8900, 1150000.00, 'showcase-porsche-911-carrera-s', true, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Esportivo icônico com pacote Sport Chrono e interior em couro.', 'automovel'),
    ('demo-2', 'Porsche', '911 Turbo S', 2024, 2024, 0, 2490000.00, 'showcase-porsche-911-turbo-s', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Zero km, configuração premium com acabamento exclusivo.', 'automovel'),
    ('demo-2', 'Lamborghini', 'Urus Performante', 2023, 2023, 5400, 3100000.00, 'showcase-lamborghini-urus', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV performance com interior alcantara e sistema ADAS completo.', 'automovel'),
    ('demo-2', 'BMW', 'M4 Competition', 2023, 2023, 3200, 890000.00, 'showcase-bmw-m4-competition', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Cupê M com pacote carbono e escape esportivo.', 'automovel'),
    ('demo-2', 'Mercedes-Benz', 'AMG GT 63 S', 2022, 2022, 7600, 980000.00, 'showcase-mercedes-amg-gt-63s', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Grand tourer com acabamento impecável e revisões em dia.', 'automovel'),
    ('demo-2', 'Audi', 'R8 V10 Performance', 2021, 2021, 11200, 1250000.00, 'showcase-audi-r8-v10', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Motor central aspirado com tração quattro.', 'automovel'),
    ('demo-2', 'McLaren', '570S Coupe', 2019, 2020, 9800, 1450000.00, 'showcase-mclaren-570s', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Fibra de carbono monocoque, baixa quilometragem.', 'automovel'),
    ('demo-2', 'Bentley', 'Continental GT', 2020, 2021, 14500, 1680000.00, 'showcase-bentley-continental-gt', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Luxo britânico com motor W12 e interior artesanal.', 'automovel'),
    ('demo-2', 'Rolls-Royce', 'Ghost Black Badge', 2021, 2022, 6200, 4200000.00, 'showcase-rolls-royce-ghost', true, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan ultra-luxo com personalização Black Badge.', 'automovel'),
    ('demo-2', 'Land Rover', 'Range Rover Sport HSE', 2023, 2024, 8900, 720000.00, 'showcase-range-rover-sport-hse', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV premium com pacote off-road e teto panorâmico.', 'automovel'),
    ('demo-2', 'Volvo', 'XC90 Recharge', 2022, 2023, 21000, 420000.00, 'showcase-volvo-xc90-recharge', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV híbrido plug-in com sete lugares e segurança Volvo.', 'automovel'),
    ('demo-2', 'Jaguar', 'F-Type R', 2020, 2021, 18500, 520000.00, 'showcase-jaguar-f-type-r', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Roadster V8 supercharged com escape ativo.', 'automovel'),
    ('demo-2', 'Maserati', 'Levante Trofeo', 2021, 2022, 24000, 680000.00, 'showcase-maserati-levante-trofeo', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV italiano com V8 Ferrari-derived.', 'automovel'),
    ('demo-2', 'Lexus', 'LC 500', 2022, 2023, 7800, 590000.00, 'showcase-lexus-lc-500', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Cupê híbrido de design premiado.', 'automovel'),
    ('demo-2', 'Cadillac', 'Escalade Sport', 2023, 2024, 12000, 890000.00, 'showcase-cadillac-escalade-sport', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Full-size luxury SUV com tecnologia Super Cruise.', 'automovel'),
    ('demo-2', 'Genesis', 'G80 Sport', 2022, 2023, 16000, 380000.00, 'showcase-genesis-g80-sport', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan premium coreano com garantia remanescente.', 'automovel'),
    ('demo-2', 'Aston Martin', 'DB11 V8', 2019, 2020, 14200, 1180000.00, 'showcase-aston-martin-db11', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'GT britânico com acabamento hand-stitched.', 'automovel'),
    ('demo-2', 'Tesla', 'Model S Plaid', 2023, 2023, 8500, 620000.00, 'showcase-tesla-model-s-plaid', false, array['https://images.unsplash.com/photo-1583121274602-3e2820c50d8d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80']::text[], 'Elétrico de alta performance com Autopilot.', 'automovel'),
    ('demo-2', 'Mercedes-Benz', 'S 580 4Matic', 2022, 2023, 11000, 780000.00, 'showcase-mercedes-s580', false, array['https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan flagship com pacote Executive Rear Seat.', 'automovel'),
    ('demo-3', 'Chevrolet', 'Camaro SS', 2020, 2020, 18000, 320000.00, 'showcase-camaro-ss', true, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'Muscle car V8 com histórico completo de revisões.', 'automovel'),
    ('demo-3', 'Ford', 'Mustang GT Premium', 2021, 2021, 14500, 295000.00, 'showcase-mustang-gt-premium', true, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Performance americana com interior premium e escape Borla.', 'automovel'),
    ('demo-3', 'Dodge', 'Challenger R/T Scat Pack', 2019, 2020, 42000, 265000.00, 'showcase-challenger-scat-pack', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'V8 HEMI 392 com pacote Shaker.', 'automovel'),
    ('demo-3', 'Jeep', 'Grand Cherokee SRT', 2019, 2020, 51000, 245000.00, 'showcase-jeep-grand-cherokee-srt', false, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV esportivo 475 cv com tração integral.', 'automovel'),
    ('demo-3', 'Toyota', 'Supra GR', 2022, 2022, 9800, 520000.00, 'showcase-toyota-supra-gr', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'Esportivo japonês com baixa quilometragem.', 'automovel'),
    ('demo-3', 'Audi', 'RS5 Sportback', 2021, 2021, 22000, 430000.00, 'showcase-audi-rs5-sportback', false, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Performance alemã com tração quattro.', 'automovel'),
    ('demo-3', 'BMW', 'M2 Competition', 2020, 2021, 28000, 390000.00, 'showcase-bmw-m2-competition', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'Compacto esportivo com câmbio DCT e bancos M.', 'automovel'),
    ('demo-3', 'Mercedes-AMG', 'A45 S', 2022, 2023, 12000, 410000.00, 'showcase-mercedes-amg-a45s', false, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Hot hatch mais potente da categoria.', 'automovel'),
    ('demo-3', 'Volkswagen', 'Golf GTI', 2021, 2022, 34000, 185000.00, 'showcase-vw-golf-gti', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'Ícone esportivo acessível com pacote Performance.', 'automovel'),
    ('demo-3', 'Honda', 'Civic Type R', 2023, 2024, 6500, 365000.00, 'showcase-honda-civic-type-r', false, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan esportivo com aerodinâmica agressiva.', 'automovel'),
    ('demo-3', 'Subaru', 'WRX STI', 2019, 2020, 48000, 210000.00, 'showcase-subaru-wrx-sti', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'AWD turbo com diferencial DCCD.', 'automovel'),
    ('demo-3', 'Nissan', '370Z Nismo', 2018, 2019, 36000, 195000.00, 'showcase-nissan-370z-nismo', false, array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Cupê V6 traseiro com kit Nismo factory.', 'automovel'),
    ('demo-3', 'Hyundai', 'Veloster N', 2022, 2023, 14000, 175000.00, 'showcase-hyundai-veloster-n', false, array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1621135802923-43ca888a1c22?auto=format&fit=crop&w=1200&q=80']::text[], 'Hot hatch três portas com escape ativo.', 'automovel'),
    ('demo-3', 'Kawasaki', 'Ninja ZX-10R', 2022, 2022, 4200, 89000.00, 'showcase-kawasaki-ninja-zx10r', true, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Superbike 998 cc com quickshifter e modos de pilotagem.', 'motocicleta'),
    ('demo-3', 'Ducati', 'Panigale V4 S', 2021, 2021, 5800, 125000.00, 'showcase-ducati-panigale-v4s', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Superesportiva italiana com suspensão Öhlins.', 'motocicleta'),
    ('demo-3', 'Harley-Davidson', 'Street Glide ST', 2023, 2023, 3100, 98000.00, 'showcase-harley-street-glide-st', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Touring premium com motor Milwaukee-Eight 117.', 'motocicleta'),
    ('demo-3', 'BMW', 'S 1000 RR', 2022, 2022, 7200, 112000.00, 'showcase-bmw-s1000rr', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Superbike alemã com pacote M.', 'motocicleta'),
    ('demo-3', 'Honda', 'CB 650R', 2023, 2024, 2800, 52000.00, 'showcase-honda-cb650r', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Naked quatro cilindros ideal para cidade e estrada.', 'motocicleta'),
    ('demo-3', 'Yamaha', 'MT-09 SP', 2022, 2023, 9100, 58000.00, 'showcase-yamaha-mt09-sp', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Três cilindros com suspensão KYB ajustável.', 'motocicleta'),
    ('demo-3', 'Triumph', 'Street Triple RS', 2021, 2022, 11500, 62000.00, 'showcase-triumph-street-triple-rs', false, array['https://images.unsplash.com/photo-1558981403-c5f9899a28f5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf4a87?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1449426463349-48f322330e84?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609630875157-be193783e6a2?auto=format&fit=crop&w=1200&q=80']::text[], 'Naked britânica com motor 765 cc de alta rotação.', 'motocicleta'),
    ('demo', 'Toyota', 'Corolla Cross XRE', 2023, 2024, 12500, 189900.00, 'showcase-corolla-cross-xre', true, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV compacto híbrido flex com pacote safety sense.', 'automovel'),
    ('demo', 'Honda', 'Civic Touring', 2022, 2023, 22000, 169900.00, 'showcase-civic-touring', true, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan premium com pacote ADAS e acabamento Touring.', 'automovel'),
    ('demo', 'Jeep', 'Compass Limited', 2021, 2022, 34000, 149900.00, 'showcase-jeep-compass-limited', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV médio com tração 4x4 e teto solar.', 'automovel'),
    ('demo', 'Volkswagen', 'T-Cross Highline', 2022, 2023, 18000, 129900.00, 'showcase-t-cross-highline', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Compacto urbano turbo TSI com interior digital.', 'automovel'),
    ('demo', 'Hyundai', 'Creta Ultimate', 2023, 2024, 9000, 139900.00, 'showcase-hyundai-creta-ultimate', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV compacto mais vendido com garantia de fábrica.', 'automovel'),
    ('demo', 'Fiat', 'Pulse Impetus', 2023, 2024, 11000, 98900.00, 'showcase-fiat-pulse-impetus', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Crossover urbano com motor turbo 270.', 'automovel'),
    ('demo', 'Chevrolet', 'Tracker Premier', 2022, 2023, 26000, 119900.00, 'showcase-chevrolet-tracker-premier', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV compacto OnStar e conectividade MyLink.', 'automovel'),
    ('demo', 'Renault', 'Kardian Premiere', 2024, 2024, 3500, 109900.00, 'showcase-renault-kardian-premiere', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Crossover novo com design europeu.', 'automovel'),
    ('demo', 'BYD', 'Dolphin Plus', 2024, 2024, 8000, 149900.00, 'showcase-byd-dolphin-plus', true, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'Elétrico urbano com autonomia estendida e recarga rápida.', 'automovel'),
    ('demo', 'Volkswagen', 'ID.4 Pro', 2023, 2024, 12000, 199900.00, 'showcase-vw-id4-pro', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV elétrico com pacote tech e assistentes de condução.', 'automovel'),
    ('demo', 'GWM', 'Haval H6 Premium', 2023, 2024, 15000, 159900.00, 'showcase-gwm-haval-h6', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV médio híbrido com acabamento premium.', 'automovel'),
    ('demo', 'Toyota', 'Corolla Hybrid Altis', 2022, 2023, 28000, 139900.00, 'showcase-corolla-hybrid-altis', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Sedan híbrido econômico e confiável.', 'automovel'),
    ('demo', 'Honda', 'HR-V Advance', 2023, 2024, 14000, 154900.00, 'showcase-honda-hrv-advance', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV compacto com Honda Sensing completo.', 'automovel'),
    ('demo', 'Peugeot', '2008 GT', 2022, 2023, 19000, 124900.00, 'showcase-peugeot-2008-gt', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Crossover com i-Cockpit e motor turbo.', 'automovel'),
    ('demo', 'Citroën', 'C4 Cactus Shine', 2021, 2022, 32000, 89900.00, 'showcase-citroen-c4-cactus', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'Conforto francês com suspensão progressiva.', 'automovel'),
    ('demo', 'Nissan', 'Kicks Exclusive', 2023, 2024, 10500, 119900.00, 'showcase-nissan-kicks-exclusive', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'Crossover com design japonês e baixo consumo.', 'automovel'),
    ('demo', 'Mitsubishi', 'Outlander HPE-S', 2022, 2023, 23000, 189900.00, 'showcase-mitsubishi-outlander-hpe', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV sete lugares com tração integral.', 'automovel'),
    ('demo', 'Chery', 'Tiggo 8 Pro Max', 2023, 2024, 17000, 169900.00, 'showcase-chery-tiggo-8-pro', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV grande com sete lugares e garantia Chery.', 'automovel'),
    ('demo', 'Ram', 'Rampage Laramie', 2024, 2024, 6000, 179900.00, 'showcase-ram-rampage-laramie', false, array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80']::text[], 'Picape média diesel com acabamento Laramie.', 'automovel'),
    ('demo', 'Ford', 'Territory Titanium', 2023, 2024, 13000, 164900.00, 'showcase-ford-territory-titanium', false, array['https://images.unsplash.com/photo-1593941707882-a5bba14938bc?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1619767886555-ef069784966c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80']::text[], 'SUV médio com motor EcoBoost e pacote Titanium.', 'automovel')
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
  description,
  vehicle_type
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
  vehicle_type = excluded.vehicle_type,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  updated_at = now();
