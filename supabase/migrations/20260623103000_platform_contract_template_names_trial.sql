/*
  migration: clarify platform contract template names (trial term vs commercial SaaS)
  purpose:
    - deactivate legacy saas-acquisition v1 stub
    - rename v2 as commercial contract
    - seed trial adhesion template for admin contract generator
  affected: public.platform_contract_templates
*/

update public.platform_contract_templates
set
  name = 'Contrato SaaS — Legado v1 (descontinuado)',
  is_active = false
where slug = 'saas-acquisition'
  and version = 1;

update public.platform_contract_templates
set
  name = 'Contrato SaaS — Licença de Uso e Assinatura (comercial)'
where slug = 'saas-acquisition'
  and version = 2;

insert into public.platform_contract_templates (slug, name, version, body_md, is_active)
values (
  'trial-adhesion',
  'Termo de Adesão ao Trial — Plano Essencial',
  1,
  $body$# Termo de Adesão ao Trial — Plano Essencial AutoPainel

## 1. Objeto
Licença temporária do SaaS AutoPainel — plano **Essencial** — por **30 dias**, incluindo vitrine whitelabel, painel, estoque, leads e módulos: Simulador de financiamento, QR Code por veículo, Métricas avançadas.

## 2. Campanha promocional
Vagas limitadas aos primeiros **20 lojistas** interessados na adesão imediata. Excepcionalmente, **não se cobra taxa de setup de R$ 497** nesses casos. Demais interessados podem solicitar o trial e entrar na **fila de espera**.

## 3. LGPD
A **Loja** é **controladora** dos dados de consumidores e leads da vitrine. A **AutoPainel** é **operadora e detentora** dos registros na infraestrutura multitenant.

## 4. Prazo e conversão
Trial de 30 dias corridos a partir do go-live. Após o prazo, continuidade exige **Contrato SaaS** assinado e pagamento (mensalidade + setup conforme proposta comercial).

## 5. Anexo I (preencher)
| Campo | Valor |
| --- | --- |
| Loja | {{counterparty_name}} |
| E-mail | {{counterparty_email}} |
| CNPJ | {{cnpj}} |
| Plano | Essencial (trial 30 dias) |
$body$,
  true
)
on conflict (slug, version) do update
set
  name = excluded.name,
  body_md = excluded.body_md,
  is_active = excluded.is_active;

comment on table public.platform_contract_templates is
  'Versioned contract templates: trial-adhesion (termo trial) and saas-acquisition (contrato comercial).';
