# Testes E2E (Playwright)

## Pré-requisitos

1. Variáveis na raiz (`.env.local` + `npm run sync:env`): pelo menos `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`.
2. Servidores Next em execução, por exemplo `npm run dev:all`, ou só `dealership-panel` (3002) e `customer-site` (3003) conforme os testes que queres correr.
3. Opcional **`E2E_DEALERSHIP_SLUG`**: slug existente na BD para fluxos felizes.
   - **Painel (`dealership-panel`):** o resolver **dashboard** ignora `dealerships.status` — qualquer slug válido deve levar `/painel` → `/login`.
   - **Vitrine (`customer-site`):** o resolver **público** só aceita **`dealerships.status = active`**. Se o slug existir mas estiver `suspended`, `pending_setup`, etc., a home vai para **`/erro/concessionaria`**; nesse caso o teste da vitrine é **ignorado** (skipped), não falha. Para falhar de propósito quando a vitrine não abre: **`E2E_STRICT_STOREFRONT_ACTIVE=true`**.

**Nota:** se usares **`NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG`** na vitrine, o teste «bare loopback → erro» é ignorado (o middleware pode redireccionar para `*.localhost`).

## Comandos

```bash
npx playwright install chromium
npm run test:e2e
```

Portas diferentes das predefinidas: `E2E_DEALERSHIP_PANEL_PORT`, `E2E_CUSTOMER_SITE_PORT`.

## O que os testes cobrem

- **Painel:** página `/erro/concessionaria` renderiza; slug inexistente → erro ao pedir `/`. Com **`E2E_DEALERSHIP_SLUG`**, `/painel` → `/login` (resolver dashboard). **Fase 5:** `h1` unificado, sem «404» no título; `<details>` técnico fechado por padrão em `development` (skip se `next start` em produção).
- **Vitrine:** slug inventado → `/erro/concessionaria` com o mesmo `h1`; rota directa `/erro/concessionaria` no `127.0.0.1`; bare loopback → erro (salvo variáveis de dev tenant). Com **`E2E_DEALERSHIP_SLUG`** e loja **`active`**, a home carrega; se a loja não for `active`, o teste é **skipped** (ver ponto 3).
- **Cross-tenant:** `e2e/specs/cross-tenant-isolation.spec.ts` — estoque guiotti vs autoprime + nome no shell (requer seed demo).
- **QR:** `e2e/specs/vehicle-qr-print.spec.ts` — lâmina QR do Ferrari demo (skip se módulo `qr_generator` off).

Os testes **não** gravam dados por padrão — verificam resolução de host, middleware e fluxos de leitura.

**Login E2E (painel lojista):** `e2e/helpers/dealership-panel-login.ts` + `e2e/specs/dealership-panel-integrations-oauth.spec.ts`. Credenciais demo (após `npm run seed:demo-users`):

- E-mail: `gestor.guiotti@autopainel.demo`
- Senha: `LojaDemo123!`
- URL: `http://guiotti.localhost:3002/login`

Variáveis opcionais: `E2E_DEALERSHIP_EMAIL`, `E2E_DEALERSHIP_PASSWORD`.
