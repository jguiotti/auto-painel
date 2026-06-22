# Arquitetura — Campanha Trial Essencial (Fase 4)

> **PRD:** `BZ-TR-001…006` · **UX:** `TRIAL_CAMPAIGN_UX_DESIGN.md`  
> **Versão:** 1.0 · junho/2026

---

## 1. Visão geral

Fluxo de dados **plataforma-global** (não tenant-scoped): prospect anônimo → intake JSONB → lead B2B → concessionária multitenant.

```mermaid
erDiagram
  saas_prospects ||--o| dealership_onboarding_intakes : "saas_prospect_id"
  dealership_onboarding_intakes ||--o| dealerships : "converted_dealership_id"
  pricing_plans ||--{ pricing_plan_modules : pivot
  pricing_plan_modules }o--|| saas_modules : module_id
  dealerships }o--|| pricing_plans : pricing_plan_id
```

**Isolamento:** `dealership_onboarding_intakes` não tem `tenant_id` — escopo **plataforma**; RLS só super admin. Dados de loja criada seguem RLS normal em `dealerships`.

---

## 2. Contratos TypeScript

| Arquivo | Conteúdo |
| --- | --- |
| `packages/shared/src/types/dealership-onboarding-intake.ts` | `DealershipOnboardingIntakePayload`, status, RPC error codes, asset specs |
| `packages/shared/src/types/supabase-rpc.ts` | Args de todas RPCs trial |
| `packages/shared/src/lib/dealership/map-onboarding-intake-to-form.ts` | Prefill admin `DealershipCreatePrefillFromIntake` |

### Payload JSON (`dealership_onboarding_intakes.payload`)

```typescript
{
  general: { store_name, cnpj, slug, wants_custom_domain, custom_domain, contact_email, whatsapp, legal_representative_name, legal_representative_cpf, billing_address },
  branding: { primary_color, primary_foreground_color, secondary_color, logo_*_url, favicon_url, google_font_* },
  storefront: { theme_mode, layout_id, hero_background_url, home_copy_by_layout: { "1"|"2"|"3": StorefrontHomeLayoutCopy } },
  institutional: { about_text, social_* },
  units: DealershipOnboardingUnitDraft[]
}
```

Validação server mínima na RPC `submit_*` (nome + e-mail + slug); demais campos validados no server action marketing e no admin create.

---

## 3. Superfície RPC

| RPC | Auth | Escopo | Request | Response | Notas |
| --- | --- | --- | --- | --- | --- |
| `submit_dealership_onboarding_intake` | anon, authenticated | plataforma | `SubmitDealershipOnboardingIntakeArgs` | `uuid` intake id | SECURITY DEFINER insert |
| `update_dealership_onboarding_intake_payload` | service_role | plataforma | `UpdateDealershipOnboardingIntakePayloadArgs` | void | Pós-upload assets |
| `link_dealership_onboarding_intake_to_prospect` | authenticated super admin | plataforma | `LinkDealershipOnboardingIntakeToProspectArgs` | void | CRM manual |
| `mark_dealership_onboarding_intake_converted` | authenticated super admin | plataforma | `MarkDealershipOnboardingIntakeConvertedArgs` | void | Pós `createDealership`; lead → `won` |
| `archive_dealership_onboarding_intake` | authenticated super admin | plataforma | `ArchiveDealershipOnboardingIntakeArgs` | void | Só se não convertido |
| `get_dealership_onboarding_intake_id_for_prospect` | authenticated super admin | plataforma | `GetDealershipOnboardingIntakeIdForProspectArgs` | `uuid \| null` | Sheet leads |
| `list_public_pricing_marketing_catalog` | anon | público | — | jsonb plans+modules | Matriz campanha via DB |

**Sem Edge Function** neste épico — uploads via service role no Next.js server action.

---

## 4. Tabelas e RLS

### `public.dealership_onboarding_intakes`

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid PK | |
| `saas_prospect_id` | uuid FK nullable | ON DELETE SET NULL |
| `status` | text | `submitted` \| `linked` \| `converted` \| `archived` |
| `payload` | jsonb | Contrato acima |
| `converted_dealership_id` | uuid FK nullable | |
| `trial_legal_version` | text | ex. `2026-06-22` |
| `trial_accepted_at` | timestamptz | LGPD + termo |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** SELECT/UPDATE → `is_platform_super_admin()`. INSERT apenas via RPC `submit_*` (SECURITY DEFINER). **Sem soft-delete** — usar status `archived`.

**Índices:** `(status, created_at desc)`, `(saas_prospect_id)`, `(converted_dealership_id)`.

### `public.pricing_plan_modules` (campanha)

| Plano slug | Módulos |
| --- | --- |
| `starter`, `trial` | finance_simulator, qr_generator, advanced_metrics |
| `business` | + recibo_compra |
| `enterprise` | todos `saas_modules` ativos |

Migração: `20260622120000_trial_campaign_pricing_and_onboarding.sql`.

### Storage

| Bucket | Acesso | Uso |
| --- | --- | --- |
| `dealership-onboarding-intakes` | public read; service_role write | Assets pré-provisionamento |
| `dealership-branding` | tenant após create | Logos definitivos pós-conversão |

---

## 5. Module gating (trial Essencial)

- Loja criada com `pricing_plan_id` → plano **starter** ou **trial** (campanha).
- Módulos efetivos via `effective_feature_keys_for_active_dealership(dealership_id)` — herda pivots acima.
- **iCarros / Meta:** no catálogo Completo com badge marketing «Em breve»; **não** incluir em trial/starter pivots.
- Recibo: só Profissional+ — não prometer no trial.

---

## 6. Fluxos server-side

### 6.1 Marketing — `submitTrialOnboardingAction`

1. Validar checkboxes LGPD (server action).
2. RPC `submit_dealership_onboarding_intake` → `intake_id`.
3. Upload assets → bucket `dealership-onboarding-intakes`.
4. RPC `update_dealership_onboarding_intake_payload` (service_role).
5. Insert `saas_prospects` (`source=trial_onboarding`, `pipeline_status=onboarding`) + link intake.

### 6.2 Admin — conversão

1. GET intake → `mapOnboardingIntakeToDealershipPrefill`.
2. `createDealershipAction` + hidden `source_intake_id`.
3. RPC `mark_dealership_onboarding_intake_converted` (best-effort).
4. `provisionDealershipHostsInBackground`.

### 6.3 Admin — ações CRM

| Action | RPC |
| --- | --- |
| `linkOnboardingIntakeToProspectAction` | `link_dealership_onboarding_intake_to_prospect` |
| `archiveOnboardingIntakeAction` | `archive_dealership_onboarding_intake` |
| `markOnboardingIntakeConvertedAction` | manual se create não passou intake id |

Arquivo: `apps/admin-master/src/actions/dealership-onboarding-intakes.ts`.

---

## 7. Migrações (ordem)

| Timestamp | Arquivo |
| --- | --- |
| `20260622120000` | `trial_campaign_pricing_and_onboarding.sql` — tabela, submit, link, storage, pivots |
| `20260622140000` | `trial_onboarding_intake_lifecycle_rpcs.sql` — convert, archive, lookup, update payload |

**Aplicar:** `npm run supabase:deploy` ou SQL manual no Dashboard (não automatizar `db push` sem pedido explícito).

---

## 8. Execution prompts (Backend / Frontend)

### Backend agent

- Consumir RPCs tipadas; mapear `DealershipOnboardingIntakeRpcErrorCode` → copy UX §7.
- Garantir `createDealershipAction` repassa logos do intake (URLs públicas) ou re-upload para `dealership-branding`.
- Sync `saas_prospects.metadata.intake_id` bidirecional no link manual.

### Frontend marketing

- Completar campos UX §3.5; usar `ONBOARDING_*_SPEC` constants.
- Passo 5: `saas_prospect_id` query param opcional para reenvio vinculado a lead existente.

### Frontend admin

- Sheet lead comercial: botão «Ver adesão» via `get_dealership_onboarding_intake_id_for_prospect`.
- Adesões trial: ações arquivar + vincular lead (`linkOnboardingIntakeToProspectAction`).
- `IntakeStatusBadge` por status.

---

## 9. Segurança

| Risco | Mitigação |
| --- | --- |
| Anon spam intakes | Rate limit Vercel/WAF (DevOps); validação RPC mínima |
| PII em payload JSONB | RLS super admin; bucket público só assets não sensíveis |
| Cross-tenant | Intake não expõe dados de outras lojas; pós-conversão RLS dealerships |
| Upload abuse | Max bytes no action; MIME allowlist |

---

## 10. Fora de escopo (arquitetura)

- Cobrança automática fim trial
- Edge Function para e-mail confirmação
- Self-service activate sem admin
- Meta / iCarros homologação

---

*Handoff: **Fase 5 Backend** — implementar sheet CRM, campos form completos, masked BR, testes RPC.*
