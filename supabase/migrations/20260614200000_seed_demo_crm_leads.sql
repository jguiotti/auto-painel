/*
  migration: demo CRM leads for funnel testing (guiotti + autoprime)
  purpose:
    - seed pipeline statuses (new, contacted, hot, won, lost) and sources for panel QA
    - optional lead_notes when demo auth user exists (after npm run seed:demo-users)
  affected: public.leads, public.lead_notes, public.vehicles (one sold unit for won lead)
  notes: idempotent by fixed lead/note UUIDs; safe to re-run on local reset and remote deploy
*/

-- ensure manual panel source is allowed (repair if phase_b constraint was not applied on remote)
alter table public.leads
  drop constraint if exists leads_source_check;

alter table public.leads
  add constraint leads_source_check check (
    source in (
      'vehicle_page',
      'finance_simulator',
      'contact_page',
      'whatsapp_float',
      'manual'
    )
  );

-- ---------------------------------------------------------------------------
-- guiotti: mark one vehicle sold for "won" lead conversion demo
-- ---------------------------------------------------------------------------

update public.vehicles as v
set
  status = 'sold',
  updated_at = now()
from public.dealerships as d
where v.dealership_id = d.id
  and d.slug = 'guiotti'
  and v.public_slug = 'demo-porsche-911'
  and v.status <> 'sold';

-- ---------------------------------------------------------------------------
-- demo leads — guiotti multimarcas
-- ---------------------------------------------------------------------------

with guiotti as (
  select id as dealership_id
  from public.dealerships
  where slug = 'guiotti'
  limit 1
),
gestor as (
  select id as user_id
  from auth.users
  where email = 'gestor.guiotti@autopainel.demo'
  limit 1
),
vehicles as (
  select
    (
      select v.id
      from public.vehicles as v
      inner join guiotti as g on g.dealership_id = v.dealership_id
      where v.public_slug = 'demo-ferrari-f8'
      limit 1
    ) as ferrari_f8_id,
    (
      select v.id
      from public.vehicles as v
      inner join guiotti as g on g.dealership_id = v.dealership_id
      where v.public_slug = 'demo-porsche-911'
      limit 1
    ) as porsche_911_id,
    (
      select v.id
      from public.vehicles as v
      inner join guiotti as g on g.dealership_id = v.dealership_id
      where v.public_slug = 'demo-porsche-turbo'
      limit 1
    ) as porsche_turbo_id,
    (
      select v.id
      from public.vehicles as v
      inner join guiotti as g on g.dealership_id = v.dealership_id
      where v.public_slug = 'demo-bmw-m4'
      limit 1
    ) as bmw_m4_id
)
insert into public.leads (
  id,
  dealership_id,
  vehicle_id,
  client_name,
  phone,
  type,
  source,
  client_email,
  message,
  status,
  next_follow_up_at,
  converted_vehicle_id,
  assigned_user_id,
  created_by,
  simulation_data,
  privacy_policy_version,
  privacy_policy_accepted_at,
  marketing_consent,
  created_at
)
select
  seed.id,
  g.dealership_id,
  seed.vehicle_id,
  seed.client_name,
  seed.phone,
  seed.type,
  seed.source,
  seed.client_email,
  seed.message,
  seed.status,
  seed.next_follow_up_at,
  seed.converted_vehicle_id,
  gestor.user_id,
  seed.created_by,
  seed.simulation_data,
  seed.privacy_policy_version,
  seed.privacy_policy_accepted_at,
  seed.marketing_consent,
  seed.created_at
from guiotti as g
cross join vehicles as ve
left join gestor on true
cross join lateral (
  values
    (
      '22222222-2222-4222-8222-222222222201'::uuid,
      ve.ferrari_f8_id,
      'Carlos Mendes',
      '5511987654321',
      'contact',
      'vehicle_page',
      'carlos.mendes@email.demo',
      'Tenho interesse no F8. Podem me ligar à tarde?',
      'new',
      null::timestamptz,
      null::uuid,
      null::uuid,
      '{}'::jsonb,
      '2026-01',
      now() - interval '2 days',
      false,
      now() - interval '2 days'
    ),
    (
      '22222222-2222-4222-8222-222222222202'::uuid,
      null::uuid,
      'Ana Paula Ferreira',
      '5511976543210',
      'contact',
      'whatsapp_float',
      'ana.ferreira@email.demo',
      'Vi a vitrine no Instagram. Quero agendar visita.',
      'contacted',
      null::timestamptz,
      null::uuid,
      null::uuid,
      '{}'::jsonb,
      '2026-01',
      now() - interval '4 days',
      true,
      now() - interval '4 days'
    ),
    (
      '22222222-2222-4222-8222-222222222203'::uuid,
      ve.porsche_turbo_id,
      'Roberto Lima',
      '5511965432109',
      'simulation',
      'finance_simulator',
      'roberto.lima@email.demo',
      'Simulação de 60x com entrada de 30%.',
      'hot',
      now() + interval '1 day',
      null::uuid,
      null::uuid,
      '{"term_months": 60, "down_payment_pct": 30, "estimated_installment": 42500}'::jsonb,
      '2026-01',
      now() - interval '6 days',
      false,
      now() - interval '6 days'
    ),
    (
      '22222222-2222-4222-8222-222222222204'::uuid,
      ve.porsche_911_id,
      'Marina Souza',
      '5511954321098',
      'contact',
      'manual',
      'marina.souza@email.demo',
      'Cliente fechou após test drive. Comprovante na unidade.',
      'won',
      null::timestamptz,
      ve.porsche_911_id,
      gestor.user_id,
      '{}'::jsonb,
      'panel_manual',
      now() - interval '10 days',
      false,
      now() - interval '10 days'
    ),
    (
      '22222222-2222-4222-8222-222222222205'::uuid,
      null::uuid,
      'Felipe Costa',
      '5511943210987',
      'contact',
      'contact_page',
      'felipe.costa@email.demo',
      'Preferiu comprar em outra loja.',
      'lost',
      null::timestamptz,
      null::uuid,
      null::uuid,
      '{}'::jsonb,
      '2026-01',
      now() - interval '8 days',
      false,
      now() - interval '8 days'
    ),
    (
      '22222222-2222-4222-8222-222222222206'::uuid,
      ve.bmw_m4_id,
      'Juliana Rocha',
      '5511932109876',
      'simulation',
      'vehicle_page',
      'juliana.rocha@email.demo',
      'Quero simular financiamento do M4.',
      'new',
      null::timestamptz,
      null::uuid,
      null::uuid,
      '{"term_months": 48, "down_payment_pct": 20, "estimated_installment": 18200}'::jsonb,
      '2026-01',
      now() - interval '1 day',
      true,
      now() - interval '1 day'
    )
) as seed(
  id,
  vehicle_id,
  client_name,
  phone,
  type,
  source,
  client_email,
  message,
  status,
  next_follow_up_at,
  converted_vehicle_id,
  created_by,
  simulation_data,
  privacy_policy_version,
  privacy_policy_accepted_at,
  marketing_consent,
  created_at
)
on conflict (id) do update set
  dealership_id = excluded.dealership_id,
  vehicle_id = excluded.vehicle_id,
  client_name = excluded.client_name,
  phone = excluded.phone,
  type = excluded.type,
  source = excluded.source,
  client_email = excluded.client_email,
  message = excluded.message,
  status = excluded.status,
  next_follow_up_at = excluded.next_follow_up_at,
  converted_vehicle_id = excluded.converted_vehicle_id,
  assigned_user_id = excluded.assigned_user_id,
  created_by = excluded.created_by,
  simulation_data = excluded.simulation_data,
  privacy_policy_version = excluded.privacy_policy_version,
  privacy_policy_accepted_at = excluded.privacy_policy_accepted_at,
  marketing_consent = excluded.marketing_consent,
  created_at = excluded.created_at;

-- ---------------------------------------------------------------------------
-- demo lead notes (guiotti) — only when demo gestor auth user exists
-- ---------------------------------------------------------------------------

insert into public.lead_notes (
  id,
  lead_id,
  dealership_id,
  author_id,
  body,
  created_at
)
select
  v.note_id,
  v.lead_id,
  d.id,
  u.id,
  v.body,
  v.created_at
from public.dealerships as d
inner join auth.users as u on u.email = 'gestor.guiotti@autopainel.demo'
cross join (
  values
    (
      '33333333-3333-4333-8333-333333333301'::uuid,
      '22222222-2222-4222-8222-222222222202'::uuid,
      'Retornamos pelo WhatsApp. Cliente pediu horário na sexta às 15h.',
      now() - interval '3 days'
    ),
    (
      '33333333-3333-4333-8333-333333333302'::uuid,
      '22222222-2222-4222-8222-222222222204'::uuid,
      'Venda concluída. Recibo emitido no estoque.',
      now() - interval '9 days'
    ),
    (
      '33333333-3333-4333-8333-333333333303'::uuid,
      '22222222-2222-4222-8222-222222222203'::uuid,
      'Cliente pediu nova simulação com 48x. Follow-up amanhã.',
      now() - interval '1 day'
    )
) as v(note_id, lead_id, body, created_at)
where d.slug = 'guiotti'
on conflict (id) do update set
  lead_id = excluded.lead_id,
  dealership_id = excluded.dealership_id,
  author_id = excluded.author_id,
  body = excluded.body,
  created_at = excluded.created_at;

-- ---------------------------------------------------------------------------
-- autoprime: one extra lead for multi-tenant smoke
-- ---------------------------------------------------------------------------

insert into public.leads (
  id,
  dealership_id,
  vehicle_id,
  client_name,
  phone,
  type,
  source,
  client_email,
  message,
  status,
  simulation_data,
  privacy_policy_version,
  privacy_policy_accepted_at,
  created_at
)
select
  '22222222-2222-4222-8222-222222222301'::uuid,
  d.id,
  ve.id,
  'Diego Alves',
  '5511923456789',
  'contact',
  'vehicle_page',
  'diego.alves@email.demo',
  'Interesse no Camaro SS. Aceito permuta.',
  'contacted',
  '{}'::jsonb,
  '2026-01',
  now() - interval '3 days',
  now() - interval '3 days'
from public.dealerships as d
inner join public.vehicles as ve
  on ve.dealership_id = d.id
  and ve.public_slug = 'demo-camaro-ss'
where d.slug = 'autoprime'
on conflict (id) do update set
  dealership_id = excluded.dealership_id,
  vehicle_id = excluded.vehicle_id,
  client_name = excluded.client_name,
  phone = excluded.phone,
  type = excluded.type,
  source = excluded.source,
  client_email = excluded.client_email,
  message = excluded.message,
  status = excluded.status,
  simulation_data = excluded.simulation_data,
  privacy_policy_version = excluded.privacy_policy_version,
  privacy_policy_accepted_at = excluded.privacy_policy_accepted_at,
  created_at = excluded.created_at;
