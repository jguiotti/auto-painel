/*
  migration: enforce canonical marketing public prices (197 / 397 / 997 BRL)
  purpose: align DB with marketing-site display when remote missed prior growth migration
*/

update public.pricing_plans
set
  name = 'Essencial',
  price_amount = 197,
  updated_at = now()
where slug = 'starter';

update public.pricing_plans
set
  name = 'Profissional',
  price_amount = 397,
  updated_at = now()
where slug = 'business';

update public.pricing_plans
set
  name = 'Completo',
  price_amount = 997,
  updated_at = now()
where slug = 'enterprise';
