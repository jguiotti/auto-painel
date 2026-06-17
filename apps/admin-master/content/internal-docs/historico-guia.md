# Guia da equipe AutoPainel

Documentação **estática e consultável** para toda a equipe. **Não é preciso preencher nada no painel admin** — o conteúdo vive nos arquivos `.md` versionados no git e é lido automaticamente em `/painel/documentacao`.

| Documento | Quando consultar |
| --- | --- |
| **Este guia** | Visão geral, runbooks, referência rápida |
| [Regras de negócio](./regras-de-negocio.md) | PRDs, regras BZ/CA, decisões de produto |
| [Documentação técnica](./documentacao-tecnica.md) | Migrações, RPCs, paths, arquitetura, QA |

**Atualização:** alterações via PR no repositório (`apps/admin-master/content/internal-docs/`). O admin mostra sempre o ficheiro do git.

---

## 1. Mapa da plataforma

| App | Pacote | Produção | Local |
| --- | --- | --- | --- |
| Site marketing | `marketing-site` | https://autopainel.com.br | :3000 |
| Admin plataforma | `admin-master` | https://admin.autopainel.com.br | :3001 |
| Painel loja | `dealership-panel` | https://{slug}.loja.autopainel.com.br | :3002 |
| Vitrine | `customer-site` | https://{slug}.autopainel.com.br | :3003 |

**Multitenant:** cada concessionária tem `slug` único. Nova loja = registo no Supabase + hosts Vercel + DNS (ver §6).

**Redes AutoPainel (marketing):** [Facebook](https://www.facebook.com/autopainel/) · [Instagram](https://www.instagram.com/auto_painel/)

---

## 2. Módulos e planos comerciais

### Chaves de módulo (`saas_modules.key`)

| Módulo | Chave | Resumo |
| --- | --- | --- |
| Simulador financiamento | `finance_simulator` | Simulação na vitrine |
| QR Code veículo | `qr_generator` | QR na ficha do estoque |
| Métricas avançadas | `advanced_metrics` | Dashboard métricas loja |
| OLX | `olx_sync` | Publicar/delistar OLX |
| WebMotors | `webmotors_sync` | Publicar/delistar WebMotors |
| iCarros | `icarros_sync` | Publicar/delistar iCarros |
| Redes sociais Meta | `social_media_kit` | Connect FB/IG + publicação |
| Recibo de venda | `recibo_compra` | Recibo simples pós-venda |

### Composição por plano (regra actual)

| Plano | Módulos típicos |
| --- | --- |
| **Starter** | Base (estoque, vitrine, leads) — sem integrações |
| **Business** | + `finance_simulator`, `qr_generator` |
| **Enterprise** | + integrações (`olx_sync`, `webmotors_sync`, `icarros_sync`, `social_media_kit`), `advanced_metrics`, etc. |

**Regras chave**

- **BZ-PLAN-001:** Business inclui só `finance_simulator` + `qr_generator`.
- **BZ-PLAN-002:** Integrações são módulos individuais no plano (típico Enterprise).
- **BZ-CAT-003:** Cada loja tem **um** `pricing_plan_id` — sem módulos avulsos por checkbox na ficha.
- **BZ-CAT-005:** Gating runtime usa RPC do plano, não `enabled_features` legado.

### Templates vitrine (`layout_id`)

| ID | Estilo |
| --- | --- |
| 1 | Premium — sidebar filtros, hero com sidecard |
| 2 | Performance — hero central, herança, grid 2 colunas |
| 3 | Tech — bento destaques, grid 4 colunas |

**Whitelabel home (v1):** `content_config.storefront_home` — editável **só no Admin Master** (BZ-WH-H003).

---

## 3. Papéis e permissões

| Papel | Onde | O que faz |
| --- | --- | --- |
| `super_admin` | admin-master | Gere concessionárias, planos, módulos, equipe |
| `owner` | dealership-panel | Gere estoque, leads, integrações da sua loja |
| `manager` | dealership-panel | Operação (escopo conforme RLS) |
| `seller` | dealership-panel | CRM/leads atribuídos (escopo vendedor) |

**BZ-TEAM-001:** Convites de colaboradores **só** no admin-master (aba Equipe) — painel loja **não** convida.

---

## 4. Ambientes demo

### Quatro lojas demo

| Nome | Slug | Plano | Layout | Uso |
| --- | --- | --- | --- | --- |
| Guiotti Multimarcas | `guiotti` | enterprise | 1 | E2E integrações + CRM |
| AutoPrime Motors | `autoprime` | business | 2 | Gating plano médio |
| EcoDrive Seminovos | `ecodrive` | starter | 3 | Gating plano entrada |
| **Demo** | `demo` | enterprise | 1 dark | **Meta App Review** |

**Login demo (painel):** e-mails `gestor.{slug}@autopainel.demo` — senha padrão documentada em `documentacao-tecnica.md` (secção demo; **não** repetir em canais públicos).

**URLs locais:** `http://{slug}.localhost:3002` (painel) · `http://{slug}.localhost:3003` (vitrine)

**URLs produção demo Meta:** `https://demo.loja.autopainel.com.br` · `https://demo.autopainel.com.br`

**Seed:** `npm run seed:demo-users` após migrações demo.

---

## 5. Integrações — estado actual

| Integração | Estado | Doc técnica |
| --- | --- | --- |
| **Meta (FB/IG)** | Connect entregue; App Review em curso; dry-run activo | `packages/shared/docs/META_INTEGRATION_SIMPLIFIED.md` |
| **OLX** | OAuth scaffold; homologação portal | `CLASSIFIEDS_OAUTH_SETUP.md` |
| **WebMotors** | Password grant + worker; API comercial pendente | Idem + `CLASSIFIEDS_INTEGRATORS_BLUEPRINT.md` |
| **iCarros** | Connect password; homologação central pendente | Idem §3 |

**Meta — regras:** app única da plataforma (BZ-META-S01); gestor não insere App ID/Secret.

**Workers:** `classifieds-sync-worker`, `social-publish-worker` — cron GitHub Actions 15 min.

---

## 6. Runbooks operacionais (dev)

Comandos na **raiz do monorepo**. Segredos só em `.env.local` / Vercel / Supabase Dashboard.

| Tarefa | Comando / doc |
| --- | --- |
| Instalar e dev | `npm install` → `npm run sync:env` → `npm run dev:all` |
| Supabase local | `npm run supabase:start` · `supabase:reset` |
| Deploy BD + Edge | `npm run supabase:deploy` → `SUPABASE_DEPLOY.md` |
| Secrets integrações | `npm run integration:secrets:configure` |
| Smoke Meta | `npm run meta:config:smoke` |
| Nova loja DNS/Vercel | `npm run dealership:hosts:provision -- {slug}` → `DEALERSHIP_HOSTS_PROVISIONING.md` |
| Deploy Vercel | `VERCEL_DEPLOY.md` |
| E2E | `npm run test:e2e` (apps dev ligados) |
| GTM / GA4 | `GTM_GA4_SETUP.md` |

### Checklist nova concessionária em produção

1. Criar loja no admin (`slug`, plano, layout, whitelabel)
2. `npm run dealership:hosts:provision -- {slug}`
3. CNAME no Registro.br (ou Cloudflare wildcard)
4. Confirmar vitrine + painel HTTPS
5. Convidar gestor (aba Equipe)

---

## 7. Roadmap épicos (resumo)

| Épico | Foco | Estado |
| --- | --- | --- |
| 0 | Decisões PM (planos, Meta Connect, workers first) | ✅ Fechado |
| 2 | Workers classificados + Meta | ✅ Entregue |
| 3 | Produção multitenant (DNS, TLS, CI) | 🟡 Em curso |
| 4 | Operação admin (KPIs, busca) | 🟡 Parcial |
| 1 | UX mobile + copy | 🟡 Parcial |
| 5 | QA encerramento | 🟡 E2E + matriz |

Detalhe: `documentacao-tecnica.md` § Roadmap épicos.

---

## 8. Regras de negócio — índice por tema

Consulte `regras-de-negocio.md` para texto completo (BZ/CA).

| Tema | IDs / secção |
| --- | --- |
| Planos e catálogo | BZ-PLAN-*, BZ-CAT-* |
| Equipe e convites | BZ-TEAM-* |
| Meta OAuth | BZ-META-S* |
| Whitelabel home | BZ-WH-H* |
| Demo E2E | BZ-DEMO-* |
| Multi-tenant / URLs | BZ-TERR-* |
| CRM / leads | Secção operação comercial 2026-06-13 |
| Classificados | Secção 2026-06-11 |

---

## 9. Documentação técnica — índice por tema

Consulte `documentacao-tecnica.md` para paths, migrações e RPCs.

| Tema | Secção na doc técnica |
| --- | --- |
| Supabase local/deploy | § Supabase local |
| Épico 2 workers | § Épico 2 — detalhe técnico |
| Meta arquitectura | § Kit redes sociais Meta |
| Classificados | § Integradores classificados v2 |
| Finance simulator | § Simulador de financiamento |
| QR generator | § Gerador de QR Code |
| Demo seed | § Ambiente demo E2E |
| Marketing SEO/GTM | § Marketing site 2026-06-17 |
| CRM Fase 8 QA | § Fase 8 QA |

---

## 10. Documentação partilhada (`packages/shared/docs/`)

| Ficheiro | Conteúdo |
| --- | --- |
| `DESIGN_SYSTEM.md` | Tailwind, tokens, shadcn |
| `SUPABASE_LOCAL.md` / `SUPABASE_DEPLOY.md` | Banco e CI |
| `VERCEL_DEPLOY.md` | 4 apps na Vercel |
| `DEALERSHIP_HOSTS_PROVISIONING.md` | DNS por loja |
| `META_INTEGRATION_SIMPLIFIED.md` | Meta Connect + App Review |
| `GTM.md` / `GTM_EVENTS.md` / `GTM_GA4_SETUP.md` | Analytics |
| `SECURITY_SECRETS.md` | Env e git safety |
| `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` | Hosts e OAuth |

---

## 11. Suporte e contacto interno

- Dúvidas de produto → secções BZ/CA em `regras-de-negocio.md`
- Dúvidas de implementação → `documentacao-tecnica.md` + `packages/shared/docs/`
- Novas funcionalidades → workflow squad (`rules/squad-agent-workflow.mdc`): PM → UX → arch → dev → QA

*Última consolidação: 2026-06-17 — espelha o histórico acumulado no repositório.*
