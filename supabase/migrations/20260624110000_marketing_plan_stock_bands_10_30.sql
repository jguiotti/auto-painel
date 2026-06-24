-- migration: update marketing plan stock band descriptions (10 / 11-30 / 30+)
-- purpose: align public pricing_plans descriptions with commercial tiers on marketing site

update public.pricing_plans
set
  description = 'Vitrine, estoque e CRM básico — faixa típica até 10 veículos ativos.',
  updated_at = now()
where slug = 'starter';

update public.pricing_plans
set
  description = 'Simulador, QR Code e operação comercial — faixa típica de 11 a 30 veículos.',
  updated_at = now()
where slug = 'business';

update public.pricing_plans
set
  description = 'Integrações OLX, WebMotors e kit Meta — faixa típica acima de 30 veículos.',
  updated_at = now()
where slug = 'enterprise';
