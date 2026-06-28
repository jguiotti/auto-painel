# UX Design — Operações comerciais, estoque, contratos e admin (Fase 3)

> **PRD:** Fase 1 squad · **Copy:** `GROWTH_OPERATIONS_UX_COPY.md` · **Versão:** 1.0 · jun/2026

---

## 1. Apps e personas

| App | Persona | Objetivo neste épico |
| --- | --- | --- |
| **dealership-panel** | Titular / gestor | Respeitar limite de estoque; pedir upgrade; ver métricas de aging; suporte rápido |
| **dealership-panel** | Vendedor | Ver métricas se plano permitir; **sem** Integrações no menu (mesma regra de módulo) |
| **marketing-site** | Prospect trial | Aceitar termos inline no wizard |
| **marketing-site** | Titular (link e-mail) | Opt-in contrato pós-ativação |
| **admin-master** | Super admin | Notificações, SLA upgrade, contato rápido, contratos opt-in |

---

## 2. Garantia — menu Integrações (já implementado + regra UX)

### Regra de produto (BZ-NAV-INT-001)

O item **Integrações** no menu lateral e mobile **só aparece** quando a loja tem **pelo menos um** módulo:

| Módulo SaaS | Superfície na página Integrações |
| --- | --- |
| `olx_sync` | Card OLX |
| `webmotors_sync` | Card WebMotors |
| `social_media_kit` | Meta + aparência carrossel |

Sem nenhum desses módulos no plano efetivo → **sem link no menu** e **redirect** de `/painel/integracoes` → `/painel`.

### Implementação atual (verificado)

```62:64:apps/dealership-panel/src/components/dashboard/DashboardShell.tsx
  const showIntegrations =
    isAnyClassifiedsModuleEnabled(activeFeatureKeys) ||
    isDealershipFeatureEnabled(activeFeatureKeys, "social_media_kit");
```

```69:71:apps/dealership-panel/src/app/painel/integracoes/page.tsx
  if (!isAnyClassifiedsModuleEnabled(activeFeatures) && !isSocialMediaKitEnabled) {
    redirect("/painel");
  }
```

- Chaves vêm de `effective_feature_keys_for_active_dealership` no `layout.tsx` (plano comercial, não `enabled_features` legado vazio).
- Dentro da página, **só renderiza seções** dos módulos contratados (cards OLX/WM/Meta isolados).
- **E2E:** `e2e/specs/dealership-panel-integrations-ux.spec.ts` — `ecodrive` e `autoprime` sem menu; redirect URL direta; `guiotti` com hub.

### Diagrama — decisão menu

```mermaid
flowchart TD
  A[Layout carrega activeFeatureKeys RPC] --> B{olx_sync OR webmotors_sync OR social_media_kit?}
  B -->|Não| C[optionalNav vazio — sem Integrações]
  B -->|Sim| D[Menu Integrações visível]
  D --> E[/painel/integracoes]
  E --> F{Só módulos contratados}
  F --> G[Cards filtrados por plano]
  C --> H[URL /integracoes manual]
  H --> I[redirect /painel]
```

### QA obrigatório (regressão)

| Loja demo | Plano | Integrações no menu? |
| --- | --- | --- |
| ecodrive | Essencial | Não |
| autoprime | Profissional | Não |
| guiotti | Completo | Sim (OLX + WM + Meta) |

---

## 3. Jornadas

### 3.1 Gestor — limite de estoque (Essencial, 10 veículos)

1. Acessa **Estoque → Novo veículo** → preenche formulário.
2. Com 10 disponíveis ativos, banner opcional já mostrou «8 de 10» (80%).
3. No 11º save → **modal bloqueante** (Dialog shared) — copy Fase 2.
4. CTA **Enviar solicitação no WhatsApp** → POST registro upgrade + abre `wa.me`.
5. Toast sucesso com SLA 1 dia útil; modal fecha; formulário permanece (não salvou).

**Estados:** loading no submit · erro rede · sucesso WhatsApp · fallback senha N/A aqui.

### 3.2 Gestor — FAB suporte (qualquer plano)

1. FAB fixo canto inferior direito (z-index acima do conteúdo, abaixo de modais).
2. Tap → **Sheet** (mobile) / **Dialog** (desktop) — assunto + mensagem.
3. Enviar → registro + WhatsApp.

### 3.3 Gestor — métricas aging (`advanced_metrics`)

1. **Visão geral** ganha bloco ou link «Ver métricas de estoque» se módulo ativo.
2. Seção dedicada (expandir `/painel` ou `/painel/metricas` — decisão arquiteto): cards + tabela atenção.
3. Sem módulo → **Card** module-gated (copy Fase 2) + CTA upgrade via FAB/modal.

### 3.4 Prospect — trial passo 5

1. Wizard passo **Confirmação** → scroll contrato inline + 3 checkboxes obrigatórios.
2. Submit bloqueado até aceites · sucesso → tela confirmação existente.

### 3.5 Titular — aceite contrato (e-mail)

1. Link token → página pública marketing.
2. Contrato renderizado + 3 opt-ins + nota Pix/NF.
3. Confirmar → tela sucesso; admin notificado.

### 3.6 Super admin — notificações

1. Sino header → dropdown últimas N + link «Ver todas».
2. Tipos com ícone/cor por categoria (upgrade = âmbar, billing = vermelho suave).
3. Clique → deep link (lead, adesão, loja, contrato).
4. Ficha loja: chips **E-mail** | **WhatsApp** sempre visíveis no topo.

---

## 4. Inventário de telas e componentes

| Componente | App | Estados | Interações | Permissão | Novo / reuse |
| --- | --- | --- | --- | --- | --- |
| `StockLimitBanner` | dealership-panel | hidden, warning 80%, at-limit | Link upgrade | owner, manager | **Novo** — Alert + Button |
| `PlanUpgradeDialog` | dealership-panel | open, submitting, success, error | Form → WhatsApp | owner, manager | **Novo** — Dialog, Textarea, Button |
| `DealershipSupportFab` | dealership-panel | idle, sheet-open | Categorias + WhatsApp | autenticado | **Novo** — FAB + Sheet (padrão marketing) |
| `InventoryAgingSection` | dealership-panel | loading, empty, success, error, module-gated | Filtro período, sort | advanced_metrics | **Novo** — Card, Table, Badge, Tooltip |
| `AttentionVehiclesTable` | dealership-panel | empty, rows | Link ficha veículo | advanced_metrics | **Novo** — Table |
| `TrialContractPreview` | marketing-site | scroll | Ler inline | anon | **Novo** — ScrollArea + prose |
| `LegalAcceptanceFieldset` | marketing-site | invalid, valid | 3 checkboxes required | anon | **Reuse** padrão ConsentCheckboxGroup estendido |
| `ContractOptInPage` | marketing-site | loading, token-invalid, form, success | 3 checkboxes | token público | **Novo** — Card, Checkbox |
| `AdminNotificationBell` | admin-master | empty, unread, list | Mark read, navigate | super_admin | **Novo** — Popover, Badge |
| `AdminNotificationsPage` | admin-master | filters, empty, list | Filters, pagination | super_admin | **Novo** — Table ou list |
| `ContactQuickActions` | admin-master | — | mailto, wa.me, copy | super_admin | **Novo** — Button group |
| `UpgradeRequestsQueue` | admin-master | empty, SLA late | Mark done | super_admin | **Novo** — Table |
| Menu Integrações | dealership-panel | hidden / visible | Navigate | módulo | **Reuse** DashboardShell (existente) |

---

## 5. Design system (`@autopainel/shared/ui`)

| Necessidade | Primitivas |
| --- | --- |
| Modal upgrade | `Dialog`, `DialogHeader`, `DialogFooter`, `Button`, `Textarea`, `Label` |
| Banner limite | `Alert`, `AlertDescription`, `Progress` (opcional barra 8/10) |
| FAB | `Button` rounded-full fixed + `Sheet` ou reutilizar padrão de `MarketingWhatsAppProvider` adaptado |
| Métricas | `Card`, `CardHeader`, `Table`, `Badge`, `Tooltip`, `Tabs` (período) |
| Notificações admin | `Popover`, `ScrollArea`, `Badge`, `Separator` |
| Opt-in legal | `Checkbox`, `Label`, `ScrollArea`, links externos |

**Novo em shared (se FAB reutilizável):** `SupportWhatsAppFab` + `SupportContactSheet` — parametrizar número env e templates mensagem.

---

## 6. Whitelabel

| Elemento | Tenant | Plataforma |
| --- | --- | --- |
| Logo sidebar | Sim | — |
| Cores primárias vitrine | Sim | Painel usa tema shared neutro |
| Copy upgrade | Genérico planos AutoPainel | Nomes Essencial/Profissional/Completo fixos |
| WhatsApp destino | Sempre AutoPainel oficial | Não whitelabel |
| E-mails contrato | Logo loja opcional no corpo | From AutoPainel |

Nome longo da loja: truncar no modal upgrade (`truncate`); slug sempre visível completo em monospace secundário.

---

## 7. Responsivo

| Breakpoint | Comportamento |
| --- | --- |
| Mobile (<768px) | FAB bottom-right 16px; upgrade modal full-width; métricas cards empilhados; menu Integrações no drawer mobile (mesma regra gating) |
| Tablet | Sidebar colapsada → drawer; tabela aging scroll horizontal |
| Desktop | Sidebar fixa; modal upgrade max-w-lg; notificações popover 380px |

---

## 8. Edge cases

| Situação | Onde | UX |
| --- | --- | --- |
| Plano sem integrações | Menu | Item **oculto** (não disabled) |
| URL `/integracoes` direta sem módulo | Route | Redirect `/painel` silencioso |
| Só `olx_sync` no plano | Integrações | Só card OLX + sem Meta |
| Limite atingido offline | Save veículo | Toast erro + modal ao reconectar |
| Upgrade duplicado | WhatsApp | Idempotência: toast «Já registramos solicitação hoje» |
| Token contrato expirado | Marketing | Página erro + WhatsApp suporte |
| Notificações vazias | Admin sino | «Nenhuma notificação no momento» |

---

## 9. Mapa de rotas (novas / alteradas)

| Rota | App | Notas |
| --- | --- | --- |
| `/painel/integracoes` | dealership-panel | Existente — gate mantido |
| `/painel/metricas` | dealership-panel | **Opcional** — ou bloco em `/painel` |
| `/aceite-contrato/[token]` | marketing-site | **Nova** — opt-in público |
| `/painel/notificacoes` | admin-master | **Nova** |
| `/painel/solicitacoes-upgrade` | admin-master | **Nova** — fila SLA |

---

## 10. Handoff arquiteto

Contratos sugeridos para Fase 4:

- `pricing_plans.max_active_vehicles` ou map slug → limite
- `platform_upgrade_requests` (dealership_id, type, payload, status, sla_due_at)
- `platform_admin_notifications` + read cursor
- `platform_contract_acceptances` (token, opt-ins JSON, accepted_at)
- RPC contagem veículos elegíveis para limite
- Helper shared `shouldShowIntegrationsNav(keys: string[]): boolean` — centralizar regra já usada no shell

---

**Design aprovado?** Próximo passo: **Fase 4 — Arquiteto Supabase** (schema + RPCs + tipos).
