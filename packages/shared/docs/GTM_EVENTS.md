# GTM — eventos unificados (4 apps, 1 dashboard GA4)

Estratégia para relatórios **dinâmicos por superfície** (`marketing`, `admin`, `dealership_panel`, `customer_storefront`) e **por loja** (`ap_dealership_slug`) num único container GTM / propriedade GA4.

Base de instalação: [`GTM.md`](./GTM.md). **Passo a passo simples (GTM + GA4):** [`GTM_GA4_SETUP.md`](./GTM_GA4_SETUP.md).

---

## Modelo mental

| Camada | Quem define | Onde vive |
| --- | --- | --- |
| **Contexto de página** | Servidor (layout) | `ap_app_surface`, `ap_page_hostname`, `ap_dealership_slug`, `ap_dealership_id` |
| **Eventos de produto** | Cliente (ações) | `ap_event`, `ap_event_category`, `ap_event_label` |
| **Trigger GTM** | Marketing/DevOps | Tag GA4 Event em `ap_custom_event` |
| **Dimensões GA4** | Admin GA4 | Registrar DL vars como custom dimensions |

Novas lojas: slug no DNS + Supabase → contexto no dataLayer **sem deploy**.

---

## Contrato de eventos (código)

Helper: `packages/shared/src/lib/analytics/push-autopainel-analytics-event.ts`

```typescript
import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";

pushAutopainelAnalyticsEvent({
  ap_event: "lead_form_submit",
  ap_event_category: "conversion",
  ap_event_label: "marketing_contact",
});
```

Push no dataLayer:

```json
{
  "event": "ap_custom_event",
  "ap_event": "lead_form_submit",
  "ap_event_category": "conversion",
  "ap_event_label": "marketing_contact"
}
```

Campos de contexto (`ap_app_surface`, etc.) já foram enviados no bootstrap da página — o GTM herda no mesmo hit se a tag GA4 usar variáveis DL.

---

## Catálogo de eventos (v1)

### Marketing (`ap_app_surface = marketing`)

| `ap_event` | Categoria | Quando | Status |
| --- | --- | --- | --- |
| `lead_form_submit` | conversion | Formulário `/contato` sucesso | ✅ implementado |
| `cookie_consent_accept` | consent | Aceitar analytics no banner | backlog |
| `whatsapp_click` | engagement | Clique no float WhatsApp | backlog |
| `cta_click` | engagement | CTAs hero (label = destino) | backlog |

### Vitrine (`customer_storefront`)

| `ap_event` | Categoria | Quando |
| --- | --- | --- |
| `vehicle_detail_view` | engagement | Abrir ficha `/veiculo/[slug]` |
| `lead_submit` | conversion | Formulário lead / simulador / WhatsApp |
| `finance_simulation` | engagement | Simulação financiamento concluída |

### Painel loja (`dealership_panel`)

| `ap_event` | Categoria | Quando |
| --- | --- | --- |
| `vehicle_publish_social` | product | Job publicação Meta enfileirado |
| `integration_connect` | product | OAuth Meta/classificados conectado |
| `lead_status_change` | product | CRM — mudança de status |

### Admin (`admin`)

| `ap_event` | Categoria | Quando |
| --- | --- | --- |
| `dealership_created` | ops | Nova concessionária criada |
| `dealership_hosts_provisioned` | ops | Script DNS/Vercel executado |

---

## Configuração GTM (passo a passo)

### 1. Variáveis Data Layer

Criar **Data Layer Variables** para:

- `ap_app_surface`
- `ap_page_hostname`
- `ap_dealership_slug`
- `ap_dealership_id`
- `ap_event`
- `ap_event_category`
- `ap_event_label`

### 2. Trigger

- **Nome:** `AP — Custom Event`
- **Tipo:** Custom Event
- **Event name:** `ap_custom_event`

### 3. Tag GA4 Event

- **Event name:** `{{ap_event}}` (variável DL)
- **Trigger:** `AP — Custom Event`
- **Event parameters:** mapear `ap_event_category`, `ap_event_label`, `ap_app_surface`, `ap_dealership_slug`

### 4. GA4 — uma propriedade, filtros por superfície

No Explorador GA4:

- Comparar `ap_app_surface` = `marketing` vs `customer_storefront`
- Segmentar vitrine por `ap_dealership_slug`
- Funil: `page_view` → `lead_form_submit` (marketing) ou `lead_submit` (vitrine)

### 5. Relatório Looker Studio (opcional)

Dimensões: `ap_app_surface`, `ap_dealership_slug`, `ap_event`  
Métricas: event count, conversions  
Uma página por superfície com filtro global.

---

## Privacidade (LGPD)

- Marketing: GTM só carrega após consentimento analytics (`cookie-consent-banner`).
- Painel/admin: política interna — sem PII em `ap_event_label`.
- Nunca enviar e-mail, telefone ou tokens no dataLayer.

---

## Checklist operacional

```
[ ] Container GTM publicado com trigger ap_custom_event
[ ] GA4 custom dimensions registradas (ap_app_surface, ap_dealership_slug, ap_event)
[ ] Preview: marketing /contato → lead_form_submit
[ ] Preview: guiotti.autopainel.com.br → ap_dealership_slug = guiotti
[ ] Explorador GA4: eventos por superfície em 24–48h
```

---

## Referência marketing (/marketing)

Ao pedir estratégia de crescimento ao agente Marketing, incluir:

1. **Métrica:** eventos `ap_event` + conversões GA4 por superfície
2. **Ferramenta:** GTM + GA4 (container `NEXT_PUBLIC_GTM_ID`)
3. **Prazo:** 48h após publicar container para dados estáveis
4. **Próximo passo:** implementar eventos backlog na app correspondente
