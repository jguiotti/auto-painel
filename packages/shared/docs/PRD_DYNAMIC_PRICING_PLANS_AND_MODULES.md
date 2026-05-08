# PRD — Construtor de planos dinâmicos e módulos (Super Admin)

Documento único para **Product / Arquitetura / Execução**. Idioma alinhado ao produto (PT-BR); identificadores técnicos em **inglês** (`snake_case`) onde indicados.

---

## 1. Contexto e estado atual do repositório

| Área | Hoje | Limitação |
|------|------|-----------|
| Módulos opcionais | `dealerships.enabled_features` (`text[]`) preenchido manualmente no formulário da concessionária | Lista fixa em código (`DEALERSHIP_OPTIONAL_FEATURES` em `packages/shared/src/lib/dealership-features.ts`), não há catálogo global nem vínculo com “plano comercial”. |
| Plano comercial | `dealerships.subscription_plan` com **CHECK** fixo: `trial`, `starter`, `business`, `enterprise` | Impede planos arbitrários (“Plano Baixada Santista Especial”). |
| Billing | `subscription_status`, `subscription_current_period_end`, `billing_notes` | Adequados para ciclo de vida; precisam conviver com **plano dinâmico** por FK. |
| Apps filhos | `isDealershipOptionalFeatureEnabled()` — array vazio = **legado = todos os opcionais ligados** | Qualquer novo modelo deve definir regra explícita para não abrir brecha de segurança por omissão. |

**Objetivo:** Super Admin define **N planos**, cada um com **preço** e **subconjunto de módulos** do catálogo; ao atribuir um plano à concessionária, **painéis e vitrine** só expõem o que o plano permite — **fonte de verdade no Postgres + RLS**.

---

## 2. Product Manager — PRD ajustado

### 2.1 Personas

- **Super Admin (operadora AutoPainel):** CRUD de módulos mestre (onde aplicável), CRUD de planos, checklist de módulos por plano, atribuição de plano à concessionária.
- **Loja (tenant):** Usuários autenticados no `dealership-panel` e visitantes no `customer-site` — sem permissão para alterar plano ou furar módulos.

### 2.2 Lista mestre de módulos (catálogo)

Chaves estáveis (`key`) são contratos de código; labels em PT-BR na UI admin.

| `key` | Nome (UI) | Descrição resumida |
|-------|-----------|-------------------|
| *(base implícito)* | **Base da vitrine** | Estoque público, tema, páginas institucionais mínimas — **sempre incluso** se a conta estiver ativa; não aparece como checkbox “opcional” ou aparece apenas como texto fixo “Incluído”. |
| `finance_simulator` | Simulador de financiamento | Fluxo / página de simulação na vitrine e ferramentas associadas no painel. |
| `qr_generator` | QR Code para veículos | Geração / uso de QR vinculado ao catálogo. |
| `advanced_metrics` | Métricas avançadas | Relatórios e indicadores extras no painel da loja. |
| `classifieds_sync` | Integração com classificados (OLX & WebMotors) | Conexão OAuth2 por popup, publicação e baixa automática de anúncios por loja. |
| `olx_sync` | Integração OLX | Sincronização ou feeds OLX (escopo técnico na epic de integração). |
| `social_media_kit` | Kit redes sociais | Geração de carrosséis whitelabel (1080×1080, templates Classic/Performance/Tech), conexão Meta (Facebook Page + Instagram Business) OAuth por popup e publicação assíncrona via Graph API a partir da finalização do cadastro do veículo (`dealership-panel`). |
| `crm_enhanced` | CRM / pipeline avançado | Funcionalidades de CRM além do fluxo mínimo de leads (quando existir). |
| `multi_branch_console` | Console multi-unidade avançado | Regras extras por filial além do cadastro base de unidades (se produto diferenciar). |
| `whatsapp_automation` | Automação WhatsApp | Mensagens / bots / templates (epic futura). |
| `api_access` | Acesso à API | Chaves ou integrações server-to-server para o tenant. |

**Governança (2026-05-07, atualizada):** a migração `20260507140000_social_media_meta_oauth_scaffold.sql` marca `social_media_kit` como ativo em catálogo e inclui pivô em Business/Enterprise (paridade com rollout de QA). Fluxo público deve ter App Meta revisado (modo desenvolvimento / produção); **trial/starter** não recebem esta chave até decisão PM. Render Sharp, worker Graph e UX de finalização de veículo seguem roadmap do Passo C.

**Nota de produto:** A lista pode crescer; novas linhas entram só via migração **seed** ou tela Super Admin “novo módulo”, desde que o código dos apps **gateie** pela `key`.

### 2.2.1 Vínculo fidedigno de módulos premium (status atual)

Para manter consistência entre pricing e feature flags dos módulos verticais já priorizados:

| Plano | Módulos obrigatórios nesta fase |
|------|----------------------------------|
| `starter` | `finance_simulator` |
| `business` | `finance_simulator`, `qr_generator`, `advanced_metrics`, `classifieds_sync`, `social_media_kit` |
| `enterprise` | todos os módulos ativos de catálogo (inclui `advanced_metrics` e `classifieds_sync`) |
| `trial` | manter alinhado à estratégia comercial ativa (quando usado, explicitar checklist no admin) |

**Regra de governança:** qualquer mudança na presença de `advanced_metrics`, `classifieds_sync` ou `social_media_kit` em planos premium deve atualizar este documento + seeds/migrações + páginas de gestão em `admin-master` no mesmo ciclo.

### 2.3 Interface — Gestão global de módulos (`admin-master`)

- Lista paginada: nome, `key`, descrição, indicador **ativo no catálogo** (permite descontinuar módulo sem apagar histórico).
- Ações: criar/editar (nome, descrição, `key` imutável após criação recomendado).
- **Critério:** `key` único global.

### 2.4 Interface — Criação / edição de plano

Campos:

- **Nome** (obrigatório), **Descrição** (opcional), **Preço** (valor monetário fidedigno — ver §3.2 para tipo DB).
- **Checklist:** todos os módulos do catálogo **selecionáveis**, exceto “Base” (somente leitura).
- **Slug opcional** para relatórios (`pricing_plans.slug`), único.

Fluxos:

- Salvar plano persiste linhas na tabela pivot **plan ↔ módulo**.
- Editar plano: alterações **passam a valer para todas as concessionárias já vinculadas**, salvo decisão explícita de “congelamento” (ver §3.4).

### 2.5 Interface — Atribuição à concessionária

- No onboarding ou edição da concessionária: select **Plano comercial** por ID (busca por nome + preço).
- Campos de billing existentes (**status**, **fim do período**, **notas**) permanecem.
- Opcional na primeira versão: ao mudar plano, **recalcular** `enabled_features` a partir do plano (ver §3.4).

### 2.6 Lógica de negócio — Feature flags efetivas

**Regra recomendada (fonte única + compatibilidade):**

1. **Resolução efetiva por servidor:** conjunto de `keys` ativas = módulos ligados ao `pricing_plan_id` da concessionária **via join** (`pricing_plan_modules` → `saas_modules.key`).
2. **Compatibilidade legado:** concessionárias **sem** `pricing_plan_id` continuam usando `enabled_features` + regra atual (`[]` = todos os opcionais).
3. **Transição:** ao atribuir um plano pela primeira vez, job ou trigger opcional pode **materializar** `enabled_features` como cópia das keys do plano (para debugging e relatórios); **gates de segurança nos apps devem usar join ou RPC**, não apenas o array se o objetivo é anti-tampering.

**Anti-fraude:** Updates diretos em `dealerships.enabled_features` ou `pricing_plan_id` por cliente **não** devem ser permitidos via políticas `authenticated` do tenant — apenas **service role** ou papel **platform operator** conforme modelo atual do admin-master.

### 2.7 Critérios de aceite (QA)

1. Super Admin cria plano P com subconjunto M de módulos; concessionária C recebe `pricing_plan_id = P`.
2. Em `dealership-panel`, rotas ou componentes guardados por `key ∈ effective_modules` **não renderizam** e **actions retornam erro claro** se módulo ausente.
3. Em `customer-site`, páginas condicionais (ex.: simulador) **404 ou mensagem institucional** quando módulo ausente.
4. Alterar checklist do plano P remove módulo m para todas as Cs com esse plano **sem cache stale prolongado** (revalidação ou leitura sempre no servidor).
5. RLS: usuário da loja **não** lê nem altera `pricing_plans` / pivot / catálogo de módulos; pode ler apenas dados públicos já filtrados pela política existente da vitrine (sem lista completa de módulos da plataforma).
6. Testes de regressão: concessionária legado sem plano mantém comportamento anterior de `enabled_features`.

---

## 3. Software Architect — Esquema de dados e tipos (`shared`)

### 3.1 Tabelas (proposta)

```text
saas_modules
  id              uuid PK default gen_random_uuid()
  key             text NOT NULL UNIQUE        -- estável para código (ex.: finance_simulator)
  display_name    text NOT NULL               -- PT-BR na UI
  description     text
  is_active       boolean NOT NULL default true
  sort_order      int NOT NULL default 0
  created_at      timestamptz NOT NULL default now()

pricing_plans
  id                  uuid PK default gen_random_uuid()
  slug                text UNIQUE             -- opcional, relatórios
  name                text NOT NULL
  description         text
  price_amount        numeric(14,2) NOT NULL default 0  -- ou bigint cents — decisão squad
  currency_code       text NOT NULL default 'BRL'
  is_active           boolean NOT NULL default true
  created_at          timestamptz NOT NULL default now()
  updated_at          timestamptz NOT NULL default now()

pricing_plan_modules
  pricing_plan_id     uuid NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE
  module_id           uuid NOT NULL REFERENCES saas_modules(id) ON DELETE RESTRICT
  PRIMARY KEY (pricing_plan_id, module_id)

dealerships (alterações)
  pricing_plan_id     uuid REFERENCES pricing_plans(id) ON DELETE SET NULL
```

**Índices:** FKs já cobrem joins; opcional `(pricing_plan_id)` em `dealerships` para métricas.

### 3.2 Preço “fidedigno”

- Preferível **`numeric(14,2)` + `currency_code`** para relatório humano e invoices simples.
- Alternativa **inteiro em centavos** (`price_cents bigint`) se integração financeira exigir — documentar decisão na migração.

### 3.3 Migração a partir do modelo atual

1. Remover ou relaxar `dealerships_subscription_plan_check` que fixa enum textual.
2. Seed `saas_modules` alinhado a `DEALERSHIP_OPTIONAL_FEATURES` + novas linhas da tabela §2.2.
3. Seed **pricing_plans** equivalentes a `starter`, `business`, `enterprise`, `trial` (se produto quiser paridade).
4. Backfill `pricing_plan_id` a partir de `subscription_plan` legível onde possível.
5. Manter `subscription_plan` como **campo espelho opcional** (slug ou nome) só para relatórios até remoção — ou substituir UI por FK apenas.

### 3.4 Materialização vs join em tempo real

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Só join em leituras | Sempre consistente após edição do plano | Query extra; cache deve ser invalidado com cuidado |
| Copiar keys para `enabled_features` ao atribuir plano | Leitura simples nos apps atuais | Drift se plano mudar — exige trigger/sync |

**Recomendação:** RPC Postgres **`effective_dealership_feature_keys(dealership_id)`** retornando `text[]`, encapsulando legado + plano; apps chamam RPC ou view estável.

### 3.5 RLS (isolamento multitenant)

- **`saas_modules`, `pricing_plans`, `pricing_plan_modules`:** sem SELECT para role `authenticated` do tenant; apenas roles operação plataforma (padrão atual do admin via service role / políticas específicas).
- **`dealerships`:** políticas existentes reforçadas para impedir que tenant altere `pricing_plan_id` e `enabled_features` sem política explícita de admin loja (idealmente **somente service role / platform**).

Detalhar políticas por tabela na migração dedicada (`packages/shared/docs` referência + SQL em `supabase/migrations/`).

### 3.6 Tipos TypeScript (`packages/shared`)

Esboço para refinamento:

```ts
// Ex.: packages/shared/src/types/pricing-catalog.ts
export interface SaasModuleRecord {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface PricingPlanRecord {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  price_amount: string; // ou number — alinhar ao cliente Supabase
  currency_code: string;
  is_active: boolean;
}

export interface PricingPlanWithModules extends PricingPlanRecord {
  module_keys: string[];
}
```

Substituir gradualmente constantes hardcoded em `subscription.ts` (`PLANS`) por fetch à tabela ou RPC.

---

## 4. Prompts de execução técnica (refino / backlog)

Copiar para tickets ou sessões de implementação:

1. **Migração SQL:** criar `saas_modules`, `pricing_plans`, `pricing_plan_modules`; adicionar `dealerships.pricing_plan_id`; seed inicial + relaxar CHECK de `subscription_plan`; comentários `COMMENT ON`.
2. **RLS + índices:** políticas permissivas apenas para papel operador plataforma; nenhum leak do catálogo para `authenticated` tenant.
3. **RPC:** `effective_dealership_feature_keys(uuid)` + testes SQL de legado (`pricing_plan_id` null + `enabled_features` []).
4. **Shared:** tipos + helper `resolveDealershipFeatureKeys(...)` substituindo gradualmente `isDealershipOptionalFeatureEnabled` onde couber (mantendo compat até front absorver).
5. **admin-master:** páginas `/painel/modulos` e `/painel/planos` (rotas em PT conforme regra do repo); formulário plano com checklist; concessionária: select `pricing_plan_id`.
6. **dealership-panel / customer-site:** substituir gates pontuais por helper único baseado na lista efetiva; garantir server components / actions validem de novo (não só UI).
7. **Observabilidade:** log estruturado quando RPC negar módulo (sem dados sensíveis).
8. **Documentação:** atualizar `SUPABASE_TYPES.md` e remover enums fixos de plano quando UI migrar.

---

## 5. Referências internas

- `packages/shared/src/lib/dealership-features.ts`
- `supabase/migrations/20260422230000_dealerships_billing_timestamps.sql`
- `supabase/migrations/20260423120000_admin_rbac_theme_leads.sql`
- `apps/admin-master/src/actions/subscription.ts`
