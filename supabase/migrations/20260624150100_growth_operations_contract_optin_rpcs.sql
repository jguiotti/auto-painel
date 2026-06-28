-- migration: growth operations — contract opt-in RPCs, trial legal extensions, template v3
-- purpose:
--   - public preview/submit contract acceptance by token
--   - admin issue acceptance token when sending contract
--   - extend trial onboarding intake with platform terms + privacy opt-ins
--   - seed contract template v3 (Pix-only, NF 3d, stock bands 10/30)
-- affected: platform_contracts, platform_contract_acceptance_tokens, platform_legal_acceptances,
--   dealership_onboarding_intakes, platform_contract_templates

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function private.hash_platform_acceptance_token(p_token text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select encode(extensions.digest(trim(p_token), 'sha256'), 'hex');
$$;

comment on function private.hash_platform_acceptance_token(text) is
  'SHA-256 hex digest for single-use contract acceptance links.';

-- ---------------------------------------------------------------------------
-- contract template v3 (derived from v2)
-- ---------------------------------------------------------------------------

insert into public.platform_contract_templates (slug, name, version, body_md, is_active)
select
  t.slug,
  'Contrato de licença SaaS AutoPainel (v3 — opt-in Pix)',
  3,
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  t.body_md,
                  'exclusivamente mediante **boleto bancário** emitido pela CONTRATADA, com vencimento na **data acordada entre as Partes** para cada competência mensal (dia fixo: **[DIA]** de cada mês), ou conforme vencimento indicado no boleto da implantação/setup.',
                  'exclusivamente via **Pix (CNPJ 47.713.237/0001-83)**, com vencimento na **data acordada entre as Partes** para cada competência mensal (dia fixo: **[DIA]** de cada mês). **Não há emissão de boleto bancário.**'
                ),
                'O pagamento será considerado realizado **somente após compensação** bancária. Boletos pagos após o vencimento estão sujeitos às penalidades da Cláusula 5ª.',
                'O pagamento será considerado realizado **somente após confirmação** do Pix na conta da CONTRATADA. Pagamentos em atraso estão sujeitos às penalidades da Cláusula 5ª.'
              ),
              'transcorridos **3 (três) dias corridos** contados do **vencimento** do boleto sem pagamento ou compensação, a CONTRATADA poderá, **sem prejuízo das demais medidas**:',
              'transcorridos **3 (três) dias corridos** contados do **vencimento** da mensalidade Pix sem pagamento ou confirmação, a CONTRATADA poderá, **sem prejuízo das demais medidas**:'
            ),
            '| **Faixa de estoque** | ☐ Até 40 · ☐ 41–80 · ☐ Acima de 80 veículos |',
            '| **Faixa de estoque** | ☐ Essencial — até 10 · ☐ Profissional — 11 a 30 · ☐ Completo — acima de 30 veículos disponíveis |'
          ),
          '| **Dia de vencimento do boleto mensal** | Dia _____ de cada mês |',
          '| **Dia de vencimento da mensalidade (Pix)** | Dia _____ de cada mês |'
        ),
        '## ASSINATURAS',
        '## ACEITE ELETRÔNICO'
      ),
      '*Documento gerado para integração ao gerador de contratos em `platform_contract_templates` (admin `/painel/contratos`). Versão 2.*',
      '*Documento gerado para integração ao gerador de contratos em `platform_contract_templates` (admin `/painel/contratos`). Versão 3 — aceite eletrônico; pagamento Pix; NF em até 3 dias corridos após confirmação do pagamento.*'
    ),
    'revisão OAB obrigatória',
    ''
  )
  || E'\n\n## CLÁUSULA 4ª-A — NOTA FISCAL\n\n4-A.1. A CONTRATADA emitirá a **nota fiscal** referente à mensalidade e taxas pagas e a enviará ao **e-mail do titular** cadastrado no Anexo I em até **3 (três) dias corridos** contados da **confirmação do pagamento** via Pix.\n',
  true
from public.platform_contract_templates as t
where t.slug = 'saas-acquisition'
  and t.version = 2
on conflict (slug, version) do update set
  body_md = excluded.body_md,
  name = excluded.name,
  is_active = excluded.is_active;

update public.platform_contract_templates
set is_active = false
where slug = 'saas-acquisition'
  and version = 2;

comment on table public.platform_contract_templates is
  'Versioned SaaS contract templates; v3 = opt-in + Pix-only + stock bands 10/30.';

-- ---------------------------------------------------------------------------
-- trial intake: extended submit with triple opt-in
-- ---------------------------------------------------------------------------

drop function if exists public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, uuid);

create or replace function public.submit_dealership_onboarding_intake(
  p_payload jsonb,
  p_trial_legal_version text,
  p_trial_accepted_at timestamptz,
  p_platform_terms_version text,
  p_platform_terms_accepted_at timestamptz,
  p_privacy_policy_version text,
  p_privacy_policy_accepted_at timestamptz,
  p_saas_prospect_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_store_name text;
  v_email text;
begin
  if p_payload is null or p_payload = '{}'::jsonb then
    raise exception 'payload_required';
  end if;

  if p_trial_legal_version is null or length(trim(p_trial_legal_version)) = 0 then
    raise exception 'trial_legal_version_required';
  end if;

  if p_trial_accepted_at is null then
    raise exception 'trial_acceptance_required';
  end if;

  if p_platform_terms_version is null or length(trim(p_platform_terms_version)) = 0 then
    raise exception 'platform_terms_version_required';
  end if;

  if p_platform_terms_accepted_at is null then
    raise exception 'platform_terms_acceptance_required';
  end if;

  if p_privacy_policy_version is null or length(trim(p_privacy_policy_version)) = 0 then
    raise exception 'privacy_policy_version_required';
  end if;

  if p_privacy_policy_accepted_at is null then
    raise exception 'privacy_policy_acceptance_required';
  end if;

  v_store_name := nullif(trim(p_payload -> 'general' ->> 'store_name'), '');
  v_email := nullif(trim(p_payload -> 'general' ->> 'contact_email'), '');

  if v_store_name is null or length(v_store_name) < 2 then
    raise exception 'store_name_required';
  end if;

  if v_email is null or v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'contact_email_invalid';
  end if;

  if p_saas_prospect_id is not null then
    if not exists (
      select 1
      from public.saas_prospects as sp
      where sp.id = p_saas_prospect_id
    ) then
      raise exception 'saas_prospect_not_found';
    end if;
  end if;

  insert into public.dealership_onboarding_intakes (
    saas_prospect_id,
    status,
    payload,
    trial_legal_version,
    trial_accepted_at,
    platform_terms_version,
    platform_terms_accepted_at,
    privacy_policy_version,
    privacy_policy_accepted_at
  )
  values (
    p_saas_prospect_id,
    case when p_saas_prospect_id is not null then 'linked' else 'submitted' end,
    p_payload,
    p_trial_legal_version,
    p_trial_accepted_at,
    p_platform_terms_version,
    p_platform_terms_accepted_at,
    p_privacy_policy_version,
    p_privacy_policy_accepted_at
  )
  returning id into v_id;

  insert into public.platform_legal_acceptances (
    entity_type,
    entity_id,
    acceptance_kind,
    document_version,
    accepted_at
  )
  values
    ('dealership_onboarding_intake', v_id, 'trial_adhesion', p_trial_legal_version, p_trial_accepted_at),
    ('dealership_onboarding_intake', v_id, 'platform_terms', p_platform_terms_version, p_platform_terms_accepted_at),
    ('dealership_onboarding_intake', v_id, 'privacy_policy', p_privacy_policy_version, p_privacy_policy_accepted_at);

  return v_id;
end;
$$;

comment on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, text, timestamptz, text, timestamptz, uuid) is
  'Marketing trial onboarding: intake + triple legal opt-in audit trail.';

revoke all on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, text, timestamptz, text, timestamptz, uuid) from public;
grant execute on function public.submit_dealership_onboarding_intake(jsonb, text, timestamptz, text, timestamptz, text, timestamptz, uuid) to anon, authenticated;

-- notify admin on new trial intake
create or replace function private.notify_trial_onboarding_intake_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_name text;
begin
  v_store_name := nullif(trim(new.payload -> 'general' ->> 'store_name'), '');

  perform private.insert_platform_admin_notification(
    'trial_onboarding_new',
    'Nova adesão trial',
    format('%s — revisar em Adesões trial.', coalesce(v_store_name, 'Loja')),
    jsonb_build_object(
      'intake_id', new.id,
      'store_name', v_store_name,
      'contact_email', new.payload -> 'general' ->> 'contact_email'
    ),
    format('/painel/adesoes-trial?intake=%s', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_dealership_onboarding_intakes_notify on public.dealership_onboarding_intakes;
create trigger trg_dealership_onboarding_intakes_notify
after insert on public.dealership_onboarding_intakes
for each row
execute function private.notify_trial_onboarding_intake_created();

-- ---------------------------------------------------------------------------
-- public contract opt-in (token)
-- ---------------------------------------------------------------------------

create or replace function public.get_platform_contract_acceptance_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_row record;
  v_contract public.platform_contracts%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'token_invalid';
  end if;

  v_hash := private.hash_platform_acceptance_token(p_token);

  select t.*
  into v_row
  from public.platform_contract_acceptance_tokens as t
  where t.token_hash = v_hash
  order by t.created_at desc
  limit 1;

  if not found then
    raise exception 'token_not_found';
  end if;

  select c.*
  into v_contract
  from public.platform_contracts as c
  where c.id = v_row.contract_id;

  if not found then
    raise exception 'contract_not_found';
  end if;

  return jsonb_build_object(
    'contract_id', v_contract.id,
    'counterparty_name', v_contract.counterparty_name,
    'counterparty_email', v_contract.counterparty_email,
    'plan_name', v_contract.plan_name,
    'body_markdown', v_contract.body_snapshot_md,
    'expires_at', v_row.expires_at,
    'is_expired',
      (
        v_contract.status <> 'accepted'
        and (
          v_row.expires_at <= now()
          or v_row.used_at is not null
        )
      ),
    'already_accepted', v_contract.status = 'accepted'
  );
end;
$$;

comment on function public.get_platform_contract_acceptance_preview(text) is
  'Public opt-in page: resolve hashed token to frozen contract preview.';

revoke all on function public.get_platform_contract_acceptance_preview(text) from public;
grant execute on function public.get_platform_contract_acceptance_preview(text) to anon, authenticated;

create or replace function public.submit_platform_contract_acceptance(
  p_token text,
  p_accept_contract boolean,
  p_accept_platform_terms boolean,
  p_accept_privacy_policy boolean,
  p_client_ip inet default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_token_row public.platform_contract_acceptance_tokens%rowtype;
  v_contract public.platform_contracts%rowtype;
  v_platform_terms_version text := '2026-06-12';
  v_privacy_policy_version text := '2026-06-12';
  v_now timestamptz := now();
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'token_invalid';
  end if;

  if not coalesce(p_accept_contract, false)
    or not coalesce(p_accept_platform_terms, false)
    or not coalesce(p_accept_privacy_policy, false)
  then
    raise exception 'acceptances_required';
  end if;

  v_hash := private.hash_platform_acceptance_token(p_token);

  select t.*
  into v_token_row
  from public.platform_contract_acceptance_tokens as t
  where t.token_hash = v_hash
  for update;

  if not found then
    raise exception 'token_not_found';
  end if;

  select c.*
  into v_contract
  from public.platform_contracts as c
  where c.id = v_token_row.contract_id
  for update;

  if v_contract.status = 'accepted' then
    return jsonb_build_object(
      'contract_id', v_contract.id,
      'status', v_contract.status,
      'accepted_at', v_contract.signed_at
    );
  end if;

  if v_token_row.used_at is not null then
    raise exception 'token_already_used';
  end if;

  if v_token_row.expires_at <= v_now then
    update public.platform_contracts as c
    set
      status = case when c.status = 'sent_for_acceptance' then 'expired' else c.status end,
      updated_at = v_now
    where c.id = v_contract.id;

    raise exception 'token_expired';
  end if;

  if v_contract.status not in ('sent_for_acceptance', 'draft') then
    raise exception 'contract_not_pending_acceptance';
  end if;

  update public.platform_contract_acceptance_tokens as t
  set used_at = v_now
  where t.id = v_token_row.id;

  update public.platform_contracts as c
  set
    status = 'accepted',
    signed_at = v_now,
    updated_at = v_now
  where c.id = v_contract.id;

  insert into public.platform_legal_acceptances (
    entity_type,
    entity_id,
    acceptance_kind,
    document_version,
    accepted_at,
    client_ip,
    user_agent
  )
  values
    (
      'platform_contract',
      v_contract.id,
      'saas_contract',
      v_contract.template_version::text,
      v_now,
      p_client_ip,
      p_user_agent
    ),
    (
      'platform_contract',
      v_contract.id,
      'platform_terms',
      v_platform_terms_version,
      v_now,
      p_client_ip,
      p_user_agent
    ),
    (
      'platform_contract',
      v_contract.id,
      'privacy_policy',
      v_privacy_policy_version,
      v_now,
      p_client_ip,
      p_user_agent
    );

  perform private.insert_platform_admin_notification(
    'contract_accepted',
    'Contrato aceito',
    format('%s confirmou aceite do contrato.', v_contract.counterparty_name),
    jsonb_build_object(
      'contract_id', v_contract.id,
      'counterparty_email', v_contract.counterparty_email
    ),
    format('/painel/contratos/%s', v_contract.id)
  );

  return jsonb_build_object(
    'contract_id', v_contract.id,
    'status', 'accepted',
    'accepted_at', v_now
  );
end;
$$;

comment on function public.submit_platform_contract_acceptance(text, boolean, boolean, boolean, inet, text) is
  'Public triple opt-in for SaaS contract; marks token used and audits legal acceptances.';

revoke all on function public.submit_platform_contract_acceptance(text, boolean, boolean, boolean, inet, text) from public;
grant execute on function public.submit_platform_contract_acceptance(text, boolean, boolean, boolean, inet, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin: send contract for acceptance (issue token + status)
-- ---------------------------------------------------------------------------

create or replace function public.issue_platform_contract_acceptance_token(
  p_contract_id uuid,
  p_expires_in_days integer default 7
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract public.platform_contracts%rowtype;
  v_raw_token text;
  v_hash text;
  v_expires_at timestamptz;
  v_token_id uuid;
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  select c.*
  into v_contract
  from public.platform_contracts as c
  where c.id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found';
  end if;

  if v_contract.status not in ('draft', 'sent_for_acceptance') then
    raise exception 'contract_not_sendable';
  end if;

  v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := private.hash_platform_acceptance_token(v_raw_token);
  v_expires_at := now() + make_interval(days => greatest(coalesce(p_expires_in_days, 7), 1));

  update public.platform_contract_acceptance_tokens as t
  set used_at = coalesce(t.used_at, now())
  where t.contract_id = p_contract_id
    and t.used_at is null
    and t.expires_at > now();

  insert into public.platform_contract_acceptance_tokens (
    contract_id,
    token_hash,
    expires_at
  )
  values (
    p_contract_id,
    v_hash,
    v_expires_at
  )
  returning id into v_token_id;

  update public.platform_contracts as c
  set
    status = 'sent_for_acceptance',
    sent_for_signature_at = coalesce(c.sent_for_signature_at, now()),
    updated_at = now()
  where c.id = p_contract_id;

  perform private.insert_platform_admin_notification(
    'contract_sent_for_acceptance',
    'Contrato enviado para aceite',
    format('%s — aguardando opt-in.', v_contract.counterparty_name),
    jsonb_build_object(
      'contract_id', p_contract_id,
      'token_id', v_token_id
    ),
    format('/painel/contratos/%s', p_contract_id)
  );

  return jsonb_build_object(
    'token', v_raw_token,
    'expires_at', v_expires_at,
    'contract_id', p_contract_id
  );
end;
$$;

comment on function public.issue_platform_contract_acceptance_token(uuid, integer) is
  'Super admin: mark contract sent_for_acceptance and return single-use raw token for e-mail link.';

revoke all on function public.issue_platform_contract_acceptance_token(uuid, integer) from public;
grant execute on function public.issue_platform_contract_acceptance_token(uuid, integer) to authenticated;

create or replace function public.mark_platform_contract_accepted_manually(
  p_contract_id uuid,
  p_reference text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract public.platform_contracts%rowtype;
  v_now timestamptz := now();
begin
  if not (select public.is_platform_super_admin()) then
    raise exception 'forbidden';
  end if;

  select c.*
  into v_contract
  from public.platform_contracts as c
  where c.id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found';
  end if;

  if v_contract.status = 'accepted' then
    return;
  end if;

  if v_contract.status not in ('sent_for_acceptance', 'draft') then
    raise exception 'contract_not_pending_acceptance';
  end if;

  update public.platform_contracts as c
  set
    status = 'accepted',
    signature_provider_ref = nullif(trim(p_reference), ''),
    signed_at = v_now,
    updated_at = v_now
  where c.id = p_contract_id;

  perform private.insert_platform_admin_notification(
    'contract_accepted',
    'Contrato aceito (manual)',
    format('%s — aceite registrado pelo operador.', v_contract.counterparty_name),
    jsonb_build_object('contract_id', p_contract_id),
    format('/painel/contratos/%s', p_contract_id)
  );
end;
$$;

comment on function public.mark_platform_contract_accepted_manually(uuid, text) is
  'Super admin offline acceptance with optional reference id.';

revoke all on function public.mark_platform_contract_accepted_manually(uuid, text) from public;
grant execute on function public.mark_platform_contract_accepted_manually(uuid, text) to authenticated;
