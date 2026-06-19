# Cloudflare Email Routing (AutoPainel)

Encaminhar e-mails `@autopainel.com.br` para a caixa pessoal **sem** contratar Google Workspace ou similar.

## Objetivo

| Endereço público | Destino |
| --- | --- |
| `contato@autopainel.com.br` | Caixa operacional (ex.: `jana.guiotti@gmail.com`) |
| Qualquer `*@autopainel.com.br` (catch-all opcional) | Mesmo destino ou regras específicas |

O site marketing já exibe **`contato@autopainel.com.br`** (`apps/marketing-site/src/lib/legal/constants.ts`).

## Pré-requisitos

1. Domínio **`autopainel.com.br`** na Cloudflare (DNS gerido pela Cloudflare).
2. Zona ativa; MX records serão substituídos pelo Email Routing.

## Passos (Dashboard Cloudflare)

1. **Email** → **Email Routing** → **Get started**.
2. Confirme os registos DNS (MX + TXT) que a Cloudflare propõe.
3. **Routing rules** → **Create address**:
   - **Custom address:** `contato`
   - **Action:** Send to an email → `jana.guiotti@gmail.com`
4. (Opcional) Catch-all: encaminhar endereços não mapeados para o mesmo destino.
5. Enviar e-mail de teste para `contato@autopainel.com.br` e confirmar receção.

## Envio (Resend)

E-mails **transacionais** (convites, leads) saem via **Resend** com domínio verificado — ver `EMAIL_RESEND_SETUP.md`. Email Routing é só para **receber** mail no domínio.

## Segurança

- Não commitar tokens Cloudflare; usar `.env.local` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`) apenas para automação DNS (`dealership:hosts:provision --cloudflare`).
