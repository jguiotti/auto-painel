# Provisionamento de hosts por concessionária (Vercel + DNS)

Nova loja no Supabase **não** publica automaticamente na Vercel nem no Registro.br. São **3 camadas** independentes:

| Camada | O quê | Automatizado hoje |
| --- | --- | --- |
| 1. Dados | `dealerships` + estoque (migração / admin) | Sim (SQL / admin-master) |
| 2. Vercel | Hostname no projecto correcto + certificado TLS | Script `npm run dealership:hosts:provision` |
| 3. DNS | CNAME no Registro.br (ou Cloudflare) | Manual **ou** Cloudflare API via script |

---

## Mapa actual de projectos Vercel (produção)

| Superfície | Projecto Vercel | Hostname |
| --- | --- | --- |
| Vitrine | `auto-painel-customer-site` | `{slug}.autopainel.com.br` |
| Painel loja | `auto-painel-dealership-panel` | `{slug}.loja.autopainel.com.br` |
| Marketing | `auto-painel-site` | `autopainel.com.br` |
| Admin | `auto-painel-admin-master` | `admin.autopainel.com.br` |

**Nota:** os nomes `autopainel-customer` / `autopainel-panel` da documentação antiga são projectos separados; produção usa os `auto-painel-*` acima.

---

## Publicar uma loja (fluxo operacional)

### Passo 1 — Dados (Supabase)

Criar ou activar concessionária no admin / migração seed. Slug final definido (ex.: `demo`, `guiotti`).

### Passo 2 — Vercel + instruções DNS

```bash
npm run dealership:hosts:provision -- demo
```

O script:

1. Regista `demo.autopainel.com.br` no projecto **customer-site**
2. Regista `demo.loja.autopainel.com.br` no projecto **dealership-panel**
3. Imprime tabela **Registro.br** com CNAME exacto (target Vercel)

Opções:

- `--dry-run` — só mostra acções
- `--cloudflare` — cria/atualiza CNAME na Cloudflare (requer env abaixo)

### Passo 3 — Registro.br (modo actual, sem Cloudflare)

No painel Registro.br → DNS → modo avançado:

| Tipo | Nome | Dados |
| --- | --- | --- |
| CNAME | `demo.autopainel.com.br` | target vitrine (ex.: `366da117763ba4e3.vercel-dns-017.com.`) |
| CNAME | `demo.loja.autopainel.com.br` | target painel (ex.: `297c3c7eae6649e4.vercel-dns-017.com.`) |

Regras Registro.br:

- **Nome = FQDN completo** — nunca `@` nem `*`
- Target = valor **exacto** que o script imprime (copiar da Vercel)
- O target de vitrine é **o mesmo** para todos os slugs no mesmo projecto; idem para painel

### Passo 4 — Validar

```bash
curl -I https://demo.autopainel.com.br
curl -I https://demo.loja.autopainel.com.br/login
```

Checklist: vitrine abre · login painel · `/painel/integracoes` (Meta App Review).

---

## Escala eficiente — 3 estratégias

### A. Registro.br + script (actual, manual DNS por slug)

**Prós:** sem mudar nameservers.  
**Contras:** 2 registos CNAME **por loja** no Registro.br.

Adequado para: poucas lojas (demo, Guiotti, clientes piloto).

### B. Cloudflare + wildcards (recomendado multitenant)

1. Registro.br → alterar **servidores DNS** para NS da Cloudflare (zona `autopainel.com.br`)
2. Uma vez na Cloudflare (zona `autopainel.com.br`, **proxy desligado** / DNS only):

| Tipo | Nome (relativo à zona) | Target Vercel |
| --- | --- | --- |
| CNAME | `*` | `366da117763ba4e3.vercel-dns-017.com` (vitrine) |
| CNAME | `*.loja` | `297c3c7eae6649e4.vercel-dns-017.com` (painel) |
| CNAME | `admin` | target admin Vercel (projecto `auto-painel-admin-master`) |
| A | `@` | `76.76.21.21` (marketing apex) |

Targets exactos: correr `npm run dealership:hosts:provision -- demo` (imprime CNAME vitrine/painel).

3. Cada loja nova: **só** `npm run dealership:hosts:provision -- {slug}` (Vercel); DNS wildcard já cobre qualquer slug.

Env para automatizar Cloudflare no script:

```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

```bash
npm run dealership:hosts:provision -- nova-loja --cloudflare
```

### C. Vercel DNS (nameservers no Registro.br → Vercel)

Apontar NS do domínio para `ns1.vercel-dns.com` / `ns2.vercel-dns.com` e gerir wildcards no painel Vercel. Hoje o domínio está em **Third Party** (NS ainda no Registro.br).

---

## Loja Demo (Meta App Review)

| Item | Valor |
| --- | --- |
| Slug | `demo` |
| Vitrine | https://demo.autopainel.com.br |
| Painel | https://demo.loja.autopainel.com.br/login |
| Integrações | https://demo.loja.autopainel.com.br/painel/integracoes |
| Credenciais | `gestor.demo@autopainel.demo` / `LojaDemo123!` |

Domínios **já registados na Vercel** (2026-06-17). NS em Cloudflare (`leonidas` / `barbara`). Confirmar wildcards `*` e `*.loja` na Cloudflare (ver secção B acima).

---

## Variáveis opcionais (`.env.local`)

```
VERCEL_TOKEN=              # CI; local usa vercel login
VERCEL_TEAM_SLUG=odona-project
VERCEL_CUSTOMER_PROJECT=auto-painel-customer-site
VERCEL_PANEL_PROJECT=auto-painel-dealership-panel
PLATFORM_ROOT_DOMAIN=autopainel.com.br
PLATFORM_PANEL_ROOT_DOMAIN=loja.autopainel.com.br
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

---

## Referências

- Deploy geral: `VERCEL_DEPLOY.md`
- Meta demo: `META_INTEGRATION_SIMPLIFIED.md` §8.6
- URLs no código: `packages/shared/src/lib/tenant/dealership-subdomain-surface-urls.ts`
