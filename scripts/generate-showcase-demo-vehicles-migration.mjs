#!/usr/bin/env node
/**
 * Generates supabase/migrations/*_seed_showcase_demo_vehicles.sql
 * Run: node scripts/generate-showcase-demo-vehicles-migration.mjs
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const IMG = (id, extra = "") =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80${extra}`;

/** @type {Record<string, string[][]>} */
const IMAGE_SETS = {
  supercar: [
    [IMG("1583121274602-3e2820c50d8d"), IMG("1503376780353-7e6692767b70"), IMG("1614162692292-7ac56d7f7f1e"), IMG("1544636331-e26879cd4d9b")],
    [IMG("1555215695-3004980adade"), IMG("1618843479313-40f8afb4b4d8"), IMG("1606664515524-ed2f786a0bd6"), IMG("1492144534655-ae79c964c9d7")],
  ],
  muscle: [
    [IMG("1552519507-da3b142c6e3d"), IMG("1584345604476-8ec5e12e42dd"), IMG("1542362567-b07e54358753"), IMG("1621135802923-43ca888a1c22")],
    [IMG("1519641471654-76ce0107ad1b"), IMG("1606664515524-ed2f786a0bd6"), IMG("1555215695-3004980adade"), IMG("1492144534655-ae79c964c9d7")],
  ],
  modern: [
    [IMG("1621007947383-b6763a5ecad9"), IMG("1609521263047-f8f205293bb4"), IMG("1549317661-bd32c8ce0db2"), IMG("1617788138017-80ad40651399")],
    [IMG("1593941707882-a5bba14938bc"), IMG("1619767886555-ef069784966c"), IMG("1606664515524-ed2f786a0bd6"), IMG("1492144534655-ae79c964c9d7")],
  ],
  moto: [
    [IMG("1558981403-c5f9899a28f5"), IMG("1568772585407-9361f9bf4a87"), IMG("1449426463349-48f322330e84"), IMG("1609630875157-be193783e6a2")],
  ],
};

function imagesFor(theme, index) {
  const sets = IMAGE_SETS[theme] ?? IMAGE_SETS.modern;
  return sets[index % sets.length];
}

function sqlArray(urls) {
  return `array[${urls.map((u) => `'${u}'`).join(", ")}]::text[]`;
}

/** @typedef {{ brand: string; model: string; my: number; yy: number; km: number; price: number; slug: string; featured?: boolean; type?: string; desc: string }} Vehicle */

/** @type {Record<string, { theme: string; vehicles: Vehicle[] }>} */
const CATALOG = {
  "demo-2": {
    theme: "supercar",
    vehicles: [
      { brand: "Ferrari", model: "F8 Tributo", my: 2022, yy: 2022, km: 1200, price: 3850000, slug: "ferrari-f8-tributo", featured: true, desc: "Superesportivo V8 biturbo com histórico de revisões na concessionária." },
      { brand: "Porsche", model: "911 Carrera S", my: 2021, yy: 2022, km: 8900, price: 1150000, slug: "porsche-911-carrera-s", featured: true, desc: "Esportivo icônico com pacote Sport Chrono e interior em couro." },
      { brand: "Porsche", model: "911 Turbo S", my: 2024, yy: 2024, km: 0, price: 2490000, slug: "porsche-911-turbo-s", desc: "Zero km, configuração premium com acabamento exclusivo." },
      { brand: "Lamborghini", model: "Urus Performante", my: 2023, yy: 2023, km: 5400, price: 3100000, slug: "lamborghini-urus", desc: "SUV performance com interior alcantara e sistema ADAS completo." },
      { brand: "BMW", model: "M4 Competition", my: 2023, yy: 2023, km: 3200, price: 890000, slug: "bmw-m4-competition", desc: "Cupê M com pacote carbono e escape esportivo." },
      { brand: "Mercedes-Benz", model: "AMG GT 63 S", my: 2022, yy: 2022, km: 7600, price: 980000, slug: "mercedes-amg-gt-63s", desc: "Grand tourer com acabamento impecável e revisões em dia." },
      { brand: "Audi", model: "R8 V10 Performance", my: 2021, yy: 2021, km: 11200, price: 1250000, slug: "audi-r8-v10", desc: "Motor central aspirado com tração quattro." },
      { brand: "McLaren", model: "570S Coupe", my: 2019, yy: 2020, km: 9800, price: 1450000, slug: "mclaren-570s", desc: "Fibra de carbono monocoque, baixa quilometragem." },
      { brand: "Bentley", model: "Continental GT", my: 2020, yy: 2021, km: 14500, price: 1680000, slug: "bentley-continental-gt", desc: "Luxo britânico com motor W12 e interior artesanal." },
      { brand: "Rolls-Royce", model: "Ghost Black Badge", my: 2021, yy: 2022, km: 6200, price: 4200000, slug: "rolls-royce-ghost", featured: true, desc: "Sedan ultra-luxo com personalização Black Badge." },
      { brand: "Land Rover", model: "Range Rover Sport HSE", my: 2023, yy: 2024, km: 8900, price: 720000, slug: "range-rover-sport-hse", desc: "SUV premium com pacote off-road e teto panorâmico." },
      { brand: "Volvo", model: "XC90 Recharge", my: 2022, yy: 2023, km: 21000, price: 420000, slug: "volvo-xc90-recharge", desc: "SUV híbrido plug-in com sete lugares e segurança Volvo." },
      { brand: "Jaguar", model: "F-Type R", my: 2020, yy: 2021, km: 18500, price: 520000, slug: "jaguar-f-type-r", desc: "Roadster V8 supercharged com escape ativo." },
      { brand: "Maserati", model: "Levante Trofeo", my: 2021, yy: 2022, km: 24000, price: 680000, slug: "maserati-levante-trofeo", desc: "SUV italiano com V8 Ferrari-derived." },
      { brand: "Lexus", model: "LC 500", my: 2022, yy: 2023, km: 7800, price: 590000, slug: "lexus-lc-500", desc: "Cupê híbrido de design premiado." },
      { brand: "Cadillac", model: "Escalade Sport", my: 2023, yy: 2024, km: 12000, price: 890000, slug: "cadillac-escalade-sport", desc: "Full-size luxury SUV com tecnologia Super Cruise." },
      { brand: "Genesis", model: "G80 Sport", my: 2022, yy: 2023, km: 16000, price: 380000, slug: "genesis-g80-sport", desc: "Sedan premium coreano com garantia remanescente." },
      { brand: "Aston Martin", model: "DB11 V8", my: 2019, yy: 2020, km: 14200, price: 1180000, slug: "aston-martin-db11", desc: "GT britânico com acabamento hand-stitched." },
      { brand: "Tesla", model: "Model S Plaid", my: 2023, yy: 2023, km: 8500, price: 620000, slug: "tesla-model-s-plaid", desc: "Elétrico de alta performance com Autopilot." },
      { brand: "Mercedes-Benz", model: "S 580 4Matic", my: 2022, yy: 2023, km: 11000, price: 780000, slug: "mercedes-s580", desc: "Sedan flagship com pacote Executive Rear Seat." },
    ],
  },
  "demo-3": {
    theme: "muscle",
    vehicles: [
      { brand: "Chevrolet", model: "Camaro SS", my: 2020, yy: 2020, km: 18000, price: 320000, slug: "camaro-ss", featured: true, desc: "Muscle car V8 com histórico completo de revisões." },
      { brand: "Ford", model: "Mustang GT Premium", my: 2021, yy: 2021, km: 14500, price: 295000, slug: "mustang-gt-premium", featured: true, desc: "Performance americana com interior premium e escape Borla." },
      { brand: "Dodge", model: "Challenger R/T Scat Pack", my: 2019, yy: 2020, km: 42000, price: 265000, slug: "challenger-scat-pack", desc: "V8 HEMI 392 com pacote Shaker." },
      { brand: "Jeep", model: "Grand Cherokee SRT", my: 2019, yy: 2020, km: 51000, price: 245000, slug: "jeep-grand-cherokee-srt", desc: "SUV esportivo 475 cv com tração integral." },
      { brand: "Toyota", model: "Supra GR", my: 2022, yy: 2022, km: 9800, price: 520000, slug: "toyota-supra-gr", desc: "Esportivo japonês com baixa quilometragem." },
      { brand: "Audi", model: "RS5 Sportback", my: 2021, yy: 2021, km: 22000, price: 430000, slug: "audi-rs5-sportback", desc: "Performance alemã com tração quattro." },
      { brand: "BMW", model: "M2 Competition", my: 2020, yy: 2021, km: 28000, price: 390000, slug: "bmw-m2-competition", desc: "Compacto esportivo com câmbio DCT e bancos M." },
      { brand: "Mercedes-AMG", model: "A45 S", my: 2022, yy: 2023, km: 12000, price: 410000, slug: "mercedes-amg-a45s", desc: "Hot hatch mais potente da categoria." },
      { brand: "Volkswagen", model: "Golf GTI", my: 2021, yy: 2022, km: 34000, price: 185000, slug: "vw-golf-gti", desc: "Ícone esportivo acessível com pacote Performance." },
      { brand: "Honda", model: "Civic Type R", my: 2023, yy: 2024, km: 6500, price: 365000, slug: "honda-civic-type-r", desc: "Sedan esportivo com aerodinâmica agressiva." },
      { brand: "Subaru", model: "WRX STI", my: 2019, yy: 2020, km: 48000, price: 210000, slug: "subaru-wrx-sti", desc: "AWD turbo com diferencial DCCD." },
      { brand: "Nissan", model: "370Z Nismo", my: 2018, yy: 2019, km: 36000, price: 195000, slug: "nissan-370z-nismo", desc: "Cupê V6 traseiro com kit Nismo factory." },
      { brand: "Hyundai", model: "Veloster N", my: 2022, yy: 2023, km: 14000, price: 175000, slug: "hyundai-veloster-n", desc: "Hot hatch três portas com escape ativo." },
      { brand: "Kawasaki", model: "Ninja ZX-10R", my: 2022, yy: 2022, km: 4200, price: 89000, slug: "kawasaki-ninja-zx10r", type: "motocicleta", featured: true, desc: "Superbike 998 cc com quickshifter e modos de pilotagem." },
      { brand: "Ducati", model: "Panigale V4 S", my: 2021, yy: 2021, km: 5800, price: 125000, slug: "ducati-panigale-v4s", type: "motocicleta", desc: "Superesportiva italiana com suspensão Öhlins." },
      { brand: "Harley-Davidson", model: "Street Glide ST", my: 2023, yy: 2023, km: 3100, price: 98000, slug: "harley-street-glide-st", type: "motocicleta", desc: "Touring premium com motor Milwaukee-Eight 117." },
      { brand: "BMW", model: "S 1000 RR", my: 2022, yy: 2022, km: 7200, price: 112000, slug: "bmw-s1000rr", type: "motocicleta", desc: "Superbike alemã com pacote M." },
      { brand: "Honda", model: "CB 650R", my: 2023, yy: 2024, km: 2800, price: 52000, slug: "honda-cb650r", type: "motocicleta", desc: "Naked quatro cilindros ideal para cidade e estrada." },
      { brand: "Yamaha", model: "MT-09 SP", my: 2022, yy: 2023, km: 9100, price: 58000, slug: "yamaha-mt09-sp", type: "motocicleta", desc: "Três cilindros com suspensão KYB ajustável." },
      { brand: "Triumph", model: "Street Triple RS", my: 2021, yy: 2022, km: 11500, price: 62000, slug: "triumph-street-triple-rs", type: "motocicleta", desc: "Naked britânica com motor 765 cc de alta rotação." },
    ],
  },
  demo: {
    theme: "modern",
    vehicles: [
      { brand: "Toyota", model: "Corolla Cross XRE", my: 2023, yy: 2024, km: 12500, price: 189900, slug: "corolla-cross-xre", featured: true, desc: "SUV compacto híbrido flex com pacote safety sense." },
      { brand: "Honda", model: "Civic Touring", my: 2022, yy: 2023, km: 22000, price: 169900, slug: "civic-touring", featured: true, desc: "Sedan premium com pacote ADAS e acabamento Touring." },
      { brand: "Jeep", model: "Compass Limited", my: 2021, yy: 2022, km: 34000, price: 149900, slug: "jeep-compass-limited", desc: "SUV médio com tração 4x4 e teto solar." },
      { brand: "Volkswagen", model: "T-Cross Highline", my: 2022, yy: 2023, km: 18000, price: 129900, slug: "t-cross-highline", desc: "Compacto urbano turbo TSI com interior digital." },
      { brand: "Hyundai", model: "Creta Ultimate", my: 2023, yy: 2024, km: 9000, price: 139900, slug: "hyundai-creta-ultimate", desc: "SUV compacto mais vendido com garantia de fábrica." },
      { brand: "Fiat", model: "Pulse Impetus", my: 2023, yy: 2024, km: 11000, price: 98900, slug: "fiat-pulse-impetus", desc: "Crossover urbano com motor turbo 270." },
      { brand: "Chevrolet", model: "Tracker Premier", my: 2022, yy: 2023, km: 26000, price: 119900, slug: "chevrolet-tracker-premier", desc: "SUV compacto OnStar e conectividade MyLink." },
      { brand: "Renault", model: "Kardian Premiere", my: 2024, yy: 2024, km: 3500, price: 109900, slug: "renault-kardian-premiere", desc: "Crossover novo com design europeu." },
      { brand: "BYD", model: "Dolphin Plus", my: 2024, yy: 2024, km: 8000, price: 149900, slug: "byd-dolphin-plus", featured: true, desc: "Elétrico urbano com autonomia estendida e recarga rápida." },
      { brand: "Volkswagen", model: "ID.4 Pro", my: 2023, yy: 2024, km: 12000, price: 199900, slug: "vw-id4-pro", desc: "SUV elétrico com pacote tech e assistentes de condução." },
      { brand: "GWM", model: "Haval H6 Premium", my: 2023, yy: 2024, km: 15000, price: 159900, slug: "gwm-haval-h6", desc: "SUV médio híbrido com acabamento premium." },
      { brand: "Toyota", model: "Corolla Hybrid Altis", my: 2022, yy: 2023, km: 28000, price: 139900, slug: "corolla-hybrid-altis", desc: "Sedan híbrido econômico e confiável." },
      { brand: "Honda", model: "HR-V Advance", my: 2023, yy: 2024, km: 14000, price: 154900, slug: "honda-hrv-advance", desc: "SUV compacto com Honda Sensing completo." },
      { brand: "Peugeot", model: "2008 GT", my: 2022, yy: 2023, km: 19000, price: 124900, slug: "peugeot-2008-gt", desc: "Crossover com i-Cockpit e motor turbo." },
      { brand: "Citroën", model: "C4 Cactus Shine", my: 2021, yy: 2022, km: 32000, price: 89900, slug: "citroen-c4-cactus", desc: "Conforto francês com suspensão progressiva." },
      { brand: "Nissan", model: "Kicks Exclusive", my: 2023, yy: 2024, km: 10500, price: 119900, slug: "nissan-kicks-exclusive", desc: "Crossover com design japonês e baixo consumo." },
      { brand: "Mitsubishi", model: "Outlander HPE-S", my: 2022, yy: 2023, km: 23000, price: 189900, slug: "mitsubishi-outlander-hpe", desc: "SUV sete lugares com tração integral." },
      { brand: "Chery", model: "Tiggo 8 Pro Max", my: 2023, yy: 2024, km: 17000, price: 169900, slug: "chery-tiggo-8-pro", desc: "SUV grande com sete lugares e garantia Chery." },
      { brand: "Ram", model: "Rampage Laramie", my: 2024, yy: 2024, km: 6000, price: 179900, slug: "ram-rampage-laramie", desc: "Picape média diesel com acabamento Laramie." },
      { brand: "Ford", model: "Territory Titanium", my: 2023, yy: 2024, km: 13000, price: 164900, slug: "ford-territory-titanium", desc: "SUV médio com motor EcoBoost e pacote Titanium." },
    ],
  },
};

const rows = [];
for (const [dealershipSlug, { theme, vehicles }] of Object.entries(CATALOG)) {
  vehicles.forEach((v, i) => {
    const vehicleType = v.type ?? "automovel";
    const imgTheme = vehicleType === "motocicleta" ? "moto" : theme;
    const imgs = imagesFor(imgTheme, i);
    const featured = v.featured ?? false;
    rows.push(
      `    ('${dealershipSlug}', '${v.brand.replace(/'/g, "''")}', '${v.model.replace(/'/g, "''")}', ${v.my}, ${v.yy}, ${v.km}, ${v.price}.00, 'showcase-${v.slug}', ${featured}, ${sqlArray(imgs)}, '${v.desc.replace(/'/g, "''")}', '${vehicleType}')`,
    );
  });
}

const migration = `/*
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
${rows.join(",\n")}
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
`;

const outPath = join(
  process.cwd(),
  "supabase/migrations/20260620190000_seed_showcase_demo_vehicles.sql",
);
writeFileSync(outPath, migration, "utf8");
console.log(`Wrote ${outPath} (${rows.length} vehicles)`);
