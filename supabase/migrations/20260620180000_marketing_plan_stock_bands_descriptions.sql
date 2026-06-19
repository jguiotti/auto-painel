/*
  migration: marketing plan descriptions with stock bands
  purpose: align pricing_plans.description with public /planos stock-tier copy
*/

update public.pricing_plans
set
  description = 'Vitrine, estoque e CRM básico — faixa típica até 40 veículos ativos.',
  updated_at = now()
where slug = 'starter';

update public.pricing_plans
set
  description = 'Simulador, QR Code e operação comercial — faixa típica de 41 a 80 veículos.',
  updated_at = now()
where slug = 'business';

update public.pricing_plans
set
  description = 'Integrações OLX, WebMotors, iCarros e kit Meta — faixa típica acima de 80 veículos.',
  updated_at = now()
where slug = 'enterprise';
