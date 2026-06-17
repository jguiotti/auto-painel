/*
  migration: Meta App Review demo dealership (production-safe seed)
  purpose:
    - provision slug "demo" named "Demo" for Meta reviewers to access panel + integrations
    - dark whitelabel theme, sample storefront copy, and catalog vehicles for social publish demo
  affected: public.dealerships, public.dealership_units, public.vehicles
  notes:
    - idempotent upsert by slug; re-run refreshes demo content without touching other tenants
    - auth user gestor.demo@autopainel.demo via npm run seed:demo-users
*/

with enterprise_plan as (
  select id
  from public.pricing_plans
  where slug = 'enterprise'
  limit 1
),
upserted as (
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
  values (
    '11111111-1111-4111-8111-111111111104'::uuid,
    'Demo',
    'demo',
    'https://placehold.co/480x120/0f172a/818cf8?text=Demo&font=montserrat',
    '5511999887766',
    'demo@autopainel.com.br',
    'active',
    1::smallint,
    (select id from enterprise_plan),
    '{
      "primary": "#818CF8",
      "accent": "#6366F1",
      "storefront_theme_mode": "dark"
    }'::jsonb,
    '{
      "primary_color": "#818CF8",
      "secondary_color": "#6366F1",
      "storefront_theme_mode": "dark",
      "font_pair_id": "sans_geometric",
      "google_font_heading": "Manrope",
      "google_font_body": "Manrope",
      "header_logo_url": "https://placehold.co/480x120/0f172a/818cf8?text=Demo&font=montserrat",
      "footer_logo_url": "https://placehold.co/240x240/0f172a/818cf8?text=Demo&font=montserrat",
      "favicon_url": "https://placehold.co/64x64/6366F1/ffffff?text=D&font=montserrat"
    }'::jsonb,
    '{
      "about_text": "Concessionária fictícia do AutoPainel para demonstração de vitrine, estoque e integração Meta (Facebook e Instagram).",
      "hq_address": {
        "postal_code": "01310-200",
        "state": "SP",
        "city": "São Paulo",
        "district": "Bela Vista",
        "street": "Av. Paulista",
        "number": "1578",
        "complement": "Conj. Demo"
      },
      "social_links": {
        "instagram": "https://instagram.com/autopainel",
        "facebook": "https://facebook.com/autopainel",
        "website": "https://autopainel.com.br"
      },
      "storefront_home": {
        "hero_background_url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80",
        "by_layout": {
          "1": {
            "hero_eyebrow": "Ambiente de demonstração AutoPainel",
            "hero_headline": "Demo",
            "hero_subheadline": "Loja de exemplo para avaliação da integração Meta — vitrine whitelabel, estoque e publicação social.",
            "hero_cta_stock": "Ver estoque demo",
            "hero_cta_whatsapp": "Falar no WhatsApp",
            "hero_sidecard_title": "Integração Meta",
            "hero_sidecard_items": [
              "Conecte Facebook e Instagram no painel",
              "Publique veículos do estoque nas redes",
              "Fluxo OAuth seguro sem código manual"
            ],
            "heritage_eyebrow": "Sobre a Demo",
            "heritage_headline": "Concessionária fictícia para testes e App Review.",
            "heritage_body": "Esta loja existe apenas para demonstrar vitrine, estoque e integrações do AutoPainel à equipa Meta.",
            "heritage_stats": [
              { "value": "6", "label": "Veículos demo" },
              { "value": "100%", "label": "Dados fictícios" },
              { "value": "Meta", "label": "Integração activa" }
            ],
            "finance_title": "Simule o financiamento",
            "finance_subtitle": "Exemplo do módulo financeiro na vitrine demo.",
            "finance_cta": "Simular parcelas"
          }
        }
      }
    }'::jsonb
  )
  on conflict (slug) do update set
    name = excluded.name,
    logo_url = excluded.logo_url,
    whatsapp_number = excluded.whatsapp_number,
    contact_email = excluded.contact_email,
    status = excluded.status,
    layout_id = excluded.layout_id,
    pricing_plan_id = coalesce(excluded.pricing_plan_id, public.dealerships.pricing_plan_id),
    theme_settings = excluded.theme_settings,
    theme_config = excluded.theme_config,
    content_config = excluded.content_config,
    updated_at = now()
  returning id
)
insert into public.dealership_units (dealership_id, name, sort_order, address)
select u.id, 'Matriz', 0, '{
  "postal_code": "01310-200",
  "state": "SP",
  "city": "São Paulo",
  "district": "Bela Vista",
  "street": "Av. Paulista",
  "number": "1578",
  "complement": "Conj. Demo"
}'::jsonb
from upserted as u
where not exists (
  select 1
  from public.dealership_units as du
  where du.dealership_id = u.id
);

update public.dealership_units as du
set
  address = '{
    "postal_code": "01310-200",
    "state": "SP",
    "city": "São Paulo",
    "district": "Bela Vista",
    "street": "Av. Paulista",
    "number": "1578",
    "complement": "Conj. Demo"
  }'::jsonb,
  updated_at = now()
from public.dealerships as d
where du.dealership_id = d.id
  and d.slug = 'demo'
  and du.name = 'Matriz';

delete from public.vehicles as v
using public.dealerships as d
where v.dealership_id = d.id
  and d.slug = 'demo'
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
    (
      'Toyota',
      'Corolla Cross XRE',
      2023,
      2024,
      12500,
      189900.00,
      'demo-corolla-cross',
      true,
      array['https://images.unsplash.com/photo-1621007947383-b6763a5ecad9?w=1200']::text[],
      'SUV compacto híbrido flex — unidade demo para publicação social.'
    ),
    (
      'Honda',
      'Civic Touring',
      2022,
      2023,
      22000,
      169900.00,
      'demo-civic-touring',
      true,
      array['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200']::text[],
      'Sedan premium com pacote ADAS — ideal para teste de carrossel Meta.'
    ),
    (
      'Jeep',
      'Compass Limited',
      2021,
      2022,
      34000,
      149900.00,
      'demo-jeep-compass',
      false,
      array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200']::text[],
      'SUV médio com tração 4x4 — estoque demo AutoPainel.'
    ),
    (
      'Volkswagen',
      'T-Cross Highline',
      2022,
      2023,
      18000,
      129900.00,
      'demo-vw-tcross',
      false,
      array['https://images.unsplash.com/photo-1609521263047-f8f205293bb4?w=1200']::text[],
      'Compacto urbano turbo — dados fictícios para App Review.'
    ),
    (
      'BMW',
      '320i M Sport',
      2021,
      2022,
      28000,
      219900.00,
      'demo-bmw-320i',
      false,
      array['https://images.unsplash.com/photo-1555215695-3004980adade?w=1200']::text[],
      'Sedan esportivo alemão — exemplo de veículo premium no catálogo demo.'
    ),
    (
      'Hyundai',
      'HB20 Platinum',
      2023,
      2024,
      9000,
      89900.00,
      'demo-hb20-platinum',
      false,
      array['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200']::text[],
      'Hatch eficiente — entrada acessível no estoque demonstrativo.'
    )
) as v(
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
) on d.slug = 'demo'
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
