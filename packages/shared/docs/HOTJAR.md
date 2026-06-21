# Hotjar — uma tag, quatro apps (segmentação)

Gravações e heatmaps de **marketing**, **admin**, **painel loja** e **vitrine** no **mesmo Site ID Hotjar**, filtradas por tags automáticas no código + filtros no dashboard.

Pré-requisito: container GTM com `NEXT_PUBLIC_GTM_ID` nos 4 projectos Vercel — ver [`GTM.md`](./GTM.md).

---

## 1. Instalar Hotjar no GTM (uma vez)

1. [Google Tag Manager](https://tagmanager.google.com/) → container `GTM-MV99ZXW9` (ou o seu).
2. **Tags** → **Nova** → modelo **Hotjar** (ou **HTML personalizado** com snippet oficial Hotjar).
3. Cole o **Site ID** Hotjar (ex.: `6543210`).
4. **Acionador:**
   - **Initialization – All Pages** (recomendado com Consent Mode), **ou**
   - **All Pages** + condição abaixo para vitrine/marketing.

### Respeitar LGPD (vitrine + marketing)

O código envia Consent Mode v2 antes do `gtm.js` e o dataLayer inclui `ap_analytics_consent`:

| Valor | Quando |
| --- | --- |
| `granted` | Cookie analytics aceite **ou** painel/admin (uso interno) |
| `denied` | Antes do banner / «Apenas essenciais» |

**Acionador sugerido para Hotjar (público):**

- Tipo: **Grupo de acionadores**
- `(Consent Initialization – All Pages)` **OU** `(Page View` + `DL — ap_analytics_consent` **equals** `granted`)`

**Painel + admin:** Hotjar pode disparar em **All Pages** (sem banner de cookies).

---

## 2. Segmentação automática (código)

Cada pageview envia no `dataLayer`:

| Campo | Exemplo | Uso |
| --- | --- | --- |
| `ap_app_surface` | `dealership_panel` | Superfície da plataforma |
| `ap_dealership_slug` | `guiotti` | Loja (multitenant) |
| `ap_analytics_consent` | `granted` | Gate LGPD |
| `ap_hotjar_tags` | `["dealership_panel","Painel loja","loja:guiotti"]` | Tags de gravação |

Valores de `ap_app_surface`:

| App | Valor | Host típico |
| --- | --- | --- |
| Marketing | `marketing` | `autopainel.com.br` |
| Admin | `admin` | `admin.autopainel.com.br` |
| Painel loja | `dealership_panel` | `{slug}.loja.autopainel.com.br` |
| Vitrine | `customer_storefront` | `{slug}.autopainel.com.br` |

O componente `AutopainelHotjarRecordingTags` chama `hj('tagRecording', [tag])` após o Hotjar carregar.

---

## 3. Variáveis GTM (criar)

| Nome | Tipo | Nome DL |
| --- | --- | --- |
| `DL — ap_app_surface` | Data Layer Variable | `ap_app_surface` |
| `DL — ap_dealership_slug` | Data Layer Variable | `ap_dealership_slug` |
| `DL — ap_analytics_consent` | Data Layer Variable | `ap_analytics_consent` |
| `DL — ap_hotjar_tags` | Data Layer Variable | `ap_hotjar_tags` |

---

## 4. Filtrar gravações no Hotjar

Em **Recordings** → **Filters**:

| Objetivo | Filtro |
| --- | --- |
| Só vitrine | Tag **contains** `customer_storefront` **ou** `Vitrine` |
| Só painel loja | Tag **contains** `dealership_panel` **ou** `Painel loja` |
| Só admin | Tag **contains** `admin` **ou** `Admin` |
| Só marketing | Tag **contains** `marketing` **ou** `Marketing` |
| Loja Guiotti (vitrine ou painel) | Tag **contains** `loja:guiotti` |
| URL painel estoque | URL **contains** `/painel/estoque` |

Salve filtros como **Segments** reutilizáveis (ex.: «Vitrine — todas as lojas», «Painel — demo-2»).

---

## 5. Heatmaps

Em **Heatmaps** → **New heatmap** → URL pattern:

| Superfície | Padrão URL |
| --- | --- |
| Vitrine home | `*.autopainel.com.br/` (excluir `admin.` e `*.loja.`) |
| Ficha veículo | `*/veiculo/*` |
| Painel estoque | `*.loja.autopainel.com.br/painel/estoque*` |
| Admin concessionárias | `admin.autopainel.com.br/painel/concessionarias*` |

---

## 6. Erros «Sem tag» no GTM (Cobertura)

Causas comuns neste monorepo:

| Causa | Páginas afetadas | Correção |
| --- | --- | --- |
| GTM só carregava **após cookie analytics** | `demo.*/termos-de-uso`, vitrine legal | ✅ GTM no `layout.tsx` raiz da vitrine **sempre**; Hotjar gated por consent |
| GTM no layout filho (fora do `<head>`) | Páginas vitrine | ✅ Movido para root layout |
| Visita **sem login** em rota protegida | `/painel/equipe`, `/painel/estoque/.../editar` | Normal: crawler sem sessão; gravações reais de usuários logados terão tag |
| `NEXT_PUBLIC_GTM_ID` ausente num projecto Vercel | App inteiro | Conferir env + redeploy nos 4 projectos |

Após deploy: **Cobertura da tag** → **Verificar novamente** nas URLs listadas.

---

## 7. Checklist

```
[ ] Tag Hotjar publicada no GTM (Site ID correto)
[ ] Acionador respeita ap_analytics_consent na vitrine/marketing
[ ] Variáveis DL ap_app_surface / ap_analytics_consent criadas
[ ] Preview GTM: guiotti.autopainel.com.br → ap_app_surface = customer_storefront
[ ] Preview GTM: guiotti.loja... → ap_app_surface = dealership_panel, loja:guiotti
[ ] Hotjar Recordings: filtrar por tag dealership_panel ou customer_storefront
[ ] Segmentos salvos no Hotjar para cada superfície
```

---

## Referências

- [`GTM.md`](./GTM.md) — instalação multitenant
- [`GTM_EVENTS.md`](./GTM_EVENTS.md) — eventos GA4
- [`GTM_GA4_SETUP.md`](./GTM_GA4_SETUP.md) — passo a passo GTM + GA4
- Código: `packages/shared/src/components/analytics/autopainel-google-tag-manager.tsx`
