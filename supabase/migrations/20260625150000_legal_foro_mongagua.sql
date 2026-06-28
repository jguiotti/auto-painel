/*
  migration: legal foro — Comarca de Mongaguá/SP
  purpose: align SaaS contract templates (v1–v3) with platform legal docs
  affected: public.platform_contract_templates
*/

update public.platform_contract_templates
set body_md = replace(body_md, 'Comarca de Santos/SP', 'Comarca de Mongaguá/SP')
where body_md like '%Comarca de Santos/SP%';

update public.platform_contract_templates
set body_md = body_md || E'\n\n## 6. Foro\n\nComarca de Mongaguá/SP, com renúncia a qualquer outro.\n'
where slug = 'trial-adhesion'
  and version = 1
  and body_md not ilike '%foro%';
