# Arquitetura — Operações comerciais, estoque, contratos e admin (Fase 4)

> **PRD:** Fase 1 squad (BZ-STK, BZ-WA, BZ-MET, BZ-CTR, BZ-ADM) · **Copy:** `GROWTH_OPERATIONS_UX_COPY.md` · **UX:** `GROWTH_OPERATIONS_UX_DESIGN.md`  
> **Versão:** 1.0 · junho/2026

---

## 1. Visão geral

Épico com **5 frentes de dados** no Supabase + contratos TypeScript compartilhados:

| Frente | Escopo | Tenant |
| --- | --- | --- |
| Limite de estoque | `pricing_plans.max_active_vehicles` + trigger `vehicles` | ✅ `dealership_id` |
| Upgrade / suporte WhatsApp | `dealership_support_requests` + RPC create | ✅ leader only insert |
| Métricas aging | RPC `get_dealership_inventory_aging_metrics` | ✅ + gate `advanced_metrics` |
| Contratos opt-in | tokens + `platform_legal_acceptances` | plataforma (público por token) |
| Notificações admin | `platform_admin_notifications` | plataforma (`super_admin`) |

```mermaid
flowchart LR
  subgraph panel [dealership-panel]
    A[create vehicle] --> B{stock limit?}
    B -->|at limit| C[PlanUpgradeDialog]
    C --> D[create_dealership_support_request]
    D --> E[wa.me]
  end
  subgraph admin [admin-master]
    F[issue_platform_contract_acceptance_token]
    G[list_platform_admin_notifications]
  end
  subgraph marketing [marketing-site]
    H[/aceite-contrato/token]
    H --> I[submit_platform_contract_acceptance]
  end
  D --> G
  F --> H
  I --> G
```

**Não executei** `supabase db push` — aplique migrações manualmente ou via `npm run supabase:deploy`.

---

## 2. Contratos TypeScript

| Arquivo | Conteúdo |
| --- | --- |
| `packages/shared/src/types/growth-operations.ts` | Status estoque, suporte, notificações, contrato, aging, opt-in |
| `packages/shared/src/types/supabase-rpc.ts` | Args das RPCs novas + `SubmitDealershipOnboardingIntakeArgs` estendido |
| `packages/shared/src/lib/dealership-features.ts` | `shouldShowIntegrationsNav()` — menu Integrações |

### Versões legais (marketing / RPC)

| Documento | Constante app | Valor inicial |
| --- | --- | --- |
| Termo trial | `TRIAL_ADHESION_VERSION` | `2026-06-22` |
| Termos de uso | `PRIVACY_POLICY_VERSION` (página termos) | `2026-06-12` |
| Privacidade | `PRIVACY_POLICY_VERSION` | `2026-06-12` |
| Contrato SaaS | `platform_contracts.template_version` | `3` (template v3) |

---

## 3. Superfície RPC

| RPC | Auth | Escopo | Request | Response | Notas |
| --- | --- | --- | --- | --- | --- |
| `get_dealership_stock_limit_status` | authenticated | tenant | `GetDealershipStockLimitStatusArgs` | `DealershipStockLimitStatus` jsonb | Contagem `available` + `is_active` |
| `create_dealership_support_request` | authenticated leader | tenant | `CreateDealershipSupportRequestArgs` | `{ request_id, sla_due_at }` | SLA +1 dia útil; trigger notificação admin |
| `get_dealership_inventory_aging_metrics` | authenticated | tenant | `GetDealershipInventoryAgingMetricsArgs` | `GetDealershipInventoryAgingMetricsResult` | Gate `advanced_metrics` dentro da RPC |
| `get_platform_contract_acceptance_preview` | anon | token | `GetPlatformContractAcceptancePreviewArgs` | `PublicContractAcceptancePreview` jsonb | Token SHA-256 em `platform_contract_acceptance_tokens` |
| `submit_platform_contract_acceptance` | anon | token | `SubmitPlatformContractAcceptanceArgs` | `{ contract_id, status, accepted_at }` | Triplo opt-in obrigatório |
| `issue_platform_contract_acceptance_token` | super_admin | plataforma | `IssuePlatformContractAcceptanceTokenArgs` | `{ token, expires_at, contract_id }` | Raw token só no retorno desta chamada |
| `mark_platform_contract_accepted_manually` | super_admin | plataforma | `MarkPlatformContractAcceptedManuallyArgs` | void | Aceite offline documentado |
| `list_platform_admin_notifications` | super_admin | plataforma | `ListPlatformAdminNotificationsArgs` | rows | |
| `mark_platform_admin_notification_read` | super_admin | plataforma | `MarkPlatformAdminNotificationReadArgs` | void | |
| `mark_all_platform_admin_notifications_read` | super_admin | — | — | integer count | |
| `scan_billing_due_admin_notifications` | service_role | plataforma | — | integer count | Cron D-7/D-3/D-0/overdue |
| `submit_dealership_onboarding_intake` | anon | plataforma | `SubmitDealershipOnboardingIntakeArgs` | uuid | **Breaking:** +3 campos legais vs. assinatura antiga |

---

## 4. Migrações

| Arquivo | Conteúdo |
| --- | --- |
| `20260624110000_marketing_plan_stock_bands_10_30.sql` | Copy marketing faixas 10/30 |
| `20260624150000_growth_operations_stock_limits_notifications.sql` | Schema principal: limites, suporte, notificações, aging, tokens, legal acceptances |
| `20260624150100_growth_operations_contract_optin_rpcs.sql` | RPCs opt-in, template v3, trial triple opt-in, trigger trial notify |

### 4.1 `pricing_plans.max_active_vehicles`

| slug | Limite |
| --- | --- |
| `starter`, `trial` | 10 |
| `business` | 30 |
| `enterprise` | `null` (sem teto) |

### 4.2 Enforcement estoque

- Contagem: `vehicles` where `status = 'available'` and `is_active = true` (OQ-1 fechado: `reserved`/`sold` **fora**).
- Trigger `trg_vehicles_enforce_stock_limit` → `raise exception 'stock_limit_reached'`.
- Campo aging: `vehicles.available_since` + trigger sync.

### 4.3 `dealership_support_requests`

| Coluna | Notas |
| --- | --- |
| `request_type` | `plan_upgrade` \| `technical_support` \| `other` |
| `sla_due_at` | +1 dia útil na RPC |
| `status` | `open` \| `in_progress` \| `done` (update só super_admin) |

**RLS:** SELECT tenant + super_admin; INSERT `private.is_dealership_leader_for(dealership_id)`.

### 4.4 `platform_admin_notifications`

Kinds: `commercial_lead_new`, `trial_onboarding_new`, `plan_upgrade_request`, `technical_support_request`, `contract_sent_for_acceptance`, `contract_accepted`, `contract_declined`, `cancellation_request`, `billing_due_*`.

Insert via `private.insert_platform_admin_notification` (SECURITY DEFINER) — triggers e RPCs internas.

### 4.5 Contratos opt-in

| Tabela | Uso |
| --- | --- |
| `platform_contract_acceptance_tokens` | `token_hash` SHA-256; expiração; `used_at` |
| `platform_legal_acceptances` | Audit trail por `entity_type` + `acceptance_kind` |

Status `platform_contracts`: `draft` → `sent_for_acceptance` → `accepted` \| `declined` \| `expired` \| `cancelled`.

Colunas legadas mantidas: `sent_for_signature_at`, `signed_at` (reutilizadas semanticamente para aceite).

Template **v3**: Pix-only, NF 3 dias, faixas 10/11–30/30+; v2 desativado (`is_active = false`).

### 4.6 Trial intake — opt-in triplo

Colunas novas em `dealership_onboarding_intakes`:

- `platform_terms_version`, `platform_terms_accepted_at`
- `privacy_policy_version`, `privacy_policy_accepted_at`

RPC grava também 3 linhas em `platform_legal_acceptances` (`entity_type = dealership_onboarding_intake`).

Trigger `trg_dealership_onboarding_intakes_notify` → `trial_onboarding_new`.

---

## 5. Module gating

| Feature | Chave | Onde |
| --- | --- | --- |
| Métricas aging | `advanced_metrics` | RPC `get_dealership_inventory_aging_metrics` |
| Menu Integrações | `olx_sync` \| `webmotors_sync` \| `social_media_kit` | `shouldShowIntegrationsNav()` — já em produção |
| Limite estoque / FAB | *(base)* | Todo titular/gestor autenticado |
| Notificações admin | `super_admin` | RLS + checks RPC |

---

## 6. Fluxos server-side (handoff Fase 5)

### 6.1 Bloqueio veículo — `createVehicleAction`

1. RPC `get_dealership_stock_limit_status` ou capturar erro `stock_limit_reached` do insert.
2. Modal upgrade → `create_dealership_support_request` + abrir WhatsApp (`NEXT_PUBLIC_SUPPORT_WHATSAPP` ou constante marketing).

### 6.2 Envio contrato — admin

1. Substituir `sendPlatformContractForSignatureAction` por RPC `issue_platform_contract_acceptance_token`.
2. E-mail Resend com link `https://autopainel.com.br/aceite-contrato/{token}`.
3. Nunca persistir raw token — só hash no DB.

### 6.3 Trial wizard — marketing

1. Passo final: 3 checkboxes (trial + termos + privacidade).
2. RPC `submit_dealership_onboarding_intake` com 7 args legais + payload.
3. **Breaking change:** atualizar `submit-trial-onboarding.ts` na Fase 5.

### 6.4 Cron billing

- GitHub Action diário `admin-billing-notifications-cron.yml` (12:00 UTC) ou `npm run admin:billing-notifications:scan` chama `scan_billing_due_admin_notifications()` com service role.

---

## 7. Execution prompts (Fase 5–6)

```
[Prompt 1 — Backend stock]
Implement server action gate + create_dealership_support_request in dealership-panel.
Map stock_limit_reached to PlanUpgradeDialog.

[Prompt 2 — Backend contracts]
Replace sendPlatformContractForSignatureAction with issue_platform_contract_acceptance_token + Resend e-mail.
Add mark_platform_contract_accepted_manually action.

[Prompt 3 — Backend trial]
Extend submit-trial-onboarding.ts with platform_terms + privacy RPC args.
Map new RPC errors in onboarding-intake-errors.ts.

[Prompt 4 — Frontend panel]
StockLimitBanner, PlanUpgradeDialog, DealershipSupportFab per GROWTH_OPERATIONS_UX_DESIGN.md.

[Prompt 5 — Frontend marketing]
/aceite-contrato/[token] page + ContractOptInPage.
Trial wizard LegalAcceptanceFieldset (3 checkboxes).

[Prompt 6 — Frontend admin]
AdminNotificationBell, /painel/notificacoes, /painel/solicitacoes-upgrade, ContactQuickActions.
Update contract status labels (sent_for_acceptance, accepted).
```

---

## 8. Open questions resolvidas (arquitetura)

| ID | Decisão |
| --- | --- |
| OQ-1 | Só `available` + `is_active` na contagem |
| OQ-2 | Campo canônico aging: `available_since` (fallback `created_at`) |
| OQ-3 | Custo carrying: 0,05%/dia do `sale_price` na RPC (educativo) |
| OQ-4 | Aceites trial em `platform_legal_acceptances` + colunas intake |
| OQ-5 | Link opt-in: `/aceite-contrato/[token]` no marketing-site |
| OQ-8 | Plano `trial` compartilha limite 10 com `starter` |

Pendentes PM: OQ-6 (e-mail operador), OQ-7 (registro pagamento NF), OQ-9 (fila upgrade vs CRM).

---

## 9. QA arquitetural

- Cross-tenant: RPC estoque/suporte/aging com `p_dealership_id` de outro tenant → `unauthorized`.
- Token: preview após `used_at` → `is_expired` true; submit → `token_already_used`.
- Integrações: regressão E2E `dealership-panel-integrations-ux.spec.ts`.

---

*Fase 4 concluída — aguardando Backend (Fase 5) e Frontend (Fase 6).*
