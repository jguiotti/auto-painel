# Social carousel render (ADR — Épico 2 E2-M3)

## Decisão

Renderização de slides 1080×1080 para publicação Meta **não roda na Edge Function** (bundle `sharp` pesado em Deno). O fluxo adotado:

1. `social-publish-worker` (Edge) reclama job em `social_publication_jobs`
2. Worker chama **Route Handler Next** no `dealership-panel`
3. Route Handler usa **Sharp** + **service role** para gerar JPEG e subir ao bucket `social-carousel-artifacts`
4. Worker publica no **Facebook (carrossel multi-foto)** e **Instagram (carrossel ≥ 2 slides)** via Graph API

## Endpoints

| Superfície | Path | Auth |
| --- | --- | --- |
| Render | `POST /api/internal/social-carousel-render` | Header `x-social-carousel-render-secret` = `SOCIAL_CAROUSEL_RENDER_SECRET` |

Corpo JSON:

```json
{
  "jobId": "uuid",
  "dealershipId": "uuid",
  "artifactTemplate": "classic | performance | tech",
  "payloadSnapshot": {
    "vehicle": { "images": [], "brand": "", "model": "", "price": 0 },
    "dealership": { "name": "", "logo_url": "https://...", "phone": "" },
    "branding_mask": true
  },
  "previewOnly": false,
  "watermarkEnabled": true
}
```

- `previewOnly: true` — path `preview/{dealershipId}/{uuid}/` (sem job); usado pelo painel em `previewVehicleCarouselAction`
- `jobId` opcional quando `previewOnly` é true

Resposta: `{ "imageUrls": [], "slideCount": N, "includesCtaSlide": true }`

## Variáveis

| Variável | Onde | Descrição |
| --- | --- | --- |
| `SOCIAL_CAROUSEL_RENDER_URL` | Supabase Edge secrets | URL absoluta do render (ex. `https://SEU_DOMINIO/api/internal/social-carousel-render` ou `http://127.0.0.1:3002/...` em dev) |
| `SOCIAL_CAROUSEL_RENDER_SECRET` | Edge + dealership-panel | Segredo partilhado do header |
| `SOCIAL_PUBLISH_DRY_RUN` | Edge | `true` simula Graph API; `false` publica de verdade |
| `META_TOKENS_CRYPTO_SECRET` | Edge | Desencriptação dos tokens Meta |

## Storage

Migração `20260610140000_social_carousel_artifacts_bucket.sql` — bucket público `social-carousel-artifacts` (Meta precisa de URL pública nas imagens).

## Templates

| `artifact_template` | Paleta |
| --- | --- |
| `classic` | Barra escura `#18181b` |
| `performance` | Vermelho `#7F1D1D` (layout 2) |
| `tech` | Azul `#2563EB` (layout 3) |

Estrutura de slides (2026-06-11):

1. **Capa** — 1.ª foto + faixa com título/preço
2. **Fotos** — demais imagens do veículo + watermark da logo (canto inferior direito, ~75% opacidade) quando `watermarkEnabled` e `dealership.logo_url` existem
3. **CTA** — slide final com nome da loja, «Saiba mais» e telefone

Settings por loja: tabela `dealership_social_carousel_settings` (`artifact_template`, `watermark_enabled`) — RPC `upsert_dealership_social_carousel_settings`.

Deploy: `packages/shared/docs/INTEGRATIONS_DEPLOY.md`

## Instagram

- Exige `instagram_business_account_id` na conexão Meta
- Carrossel Graph API: mínimo **2** slides renderizados
- Com `SOCIAL_PUBLISH_DRY_RUN=true`, worker regista `mode: dry_run` sem chamar Graph

## Referências

- `supabase/functions/_shared/social-publish-process-job.ts`
- `apps/dealership-panel/src/lib/social/render-social-carousel-slides.ts`
- `packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md`
