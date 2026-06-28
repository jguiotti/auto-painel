# Backlog — o que falta (jun/2026)

> **Atualizado:** 2026-06-25 · Growth Operations + trial **fechados em código**. Ver **`EPICS_CLOSURE_JUN2026.md`**.

---

## Bloqueado — aguardando terceiros

| Item | Motivo | Quando retomar |
| --- | --- | --- |
| **Integração Meta** (Lead Ads / CAPI) | Homologação e credenciais pendentes com suporte Meta | Após aprovação + secrets em prod |

**Não iniciar** desenvolvimento adicional nessas integrações até liberação do fornecedor.

---

## Épico — Equipe comercial AutoPainel (Platform Sales Squad)

| Fase | Status |
| --- | --- |
| 1–8 + DevOps cron v1.1 | ✅ **Fechado** |

**Backlog opcional pós-v1.1:** campanhas de incentivo (UI admin) · notificações e-mail rep.

---

## Épicos fechados (jun/2026)

| Épico / área | Estado |
| --- | --- |
| **Épico 3** go-live multitenant (base técnica) | ✅ smoke + E2E prod |
| **Épico 4** polish admin | ✅ |
| **Épico 5** QA onda produção | ✅ smoke/E2E prod |
| CRM loja (A–D + multi-interesse) | ✅ |
| Crescimento P0–P4 (exc. guerrilla) | ✅ |
| Workers OLX / Webmotors | ✅ |
| Platform Sales Squad v1.1 | ✅ |
| Contrato SaaS v3 (Pix + opt-in + template DB) | ✅ |
| **Growth Operations** (stock, upgrade, admin inbox, financeiro) | ✅ |
| **Campanha trial Essencial** (wizard, upload, opt-in triplo) | ✅ |
| Legal foro Mongaguá/SP | ✅ |
| CI cron billing + lead notification fix | ✅ |

---

## Pendente operacional (não é código)

| Item | Responsável |
| --- | --- |
| **`git push origin main`** — workflows CI atualizados no repo | Dev |
| **`npm run supabase:deploy`** — migração `20260625150000` (foro) se ainda não aplicada | DevOps |
| **1ª loja cliente** fora demos + Pix pago | Comercial / ops |
| **DNS www** → apex na Cloudflare (`www.autopainel.com.br`) | DevOps |
| **Revisão OAB** contrato v3 antes de assinar clientes | Jurídico |
| **QA manual** aceite contrato + limite estoque + upload trial | QA |
| **Guerrilla marketing P4** | Produto |

---

## Backlog técnico opcional (pós-fechamento)

| Área | O que falta | Prioridade |
| --- | --- | --- |
| E2E Growth Operations | Stock limit + aceite contrato automatizado | P2 |
| INT auto-publish portais | Fluxo publish automático completo | P2 |
| E-mail Auth Fase 2 | Templates whitelabel painel | P2 |
| E2E admin-master local | Timeout :3001 intermitente | P3 |
| Campanhas incentivo Sales Squad | UI admin | P3 |

---

## Verificação

```bash
npm run verify:epics-closure          # smoke produção
npm run verify:epics-closure -- --e2e # + E2E login demo prod
npm run admin:billing-notifications:scan  # cron billing (local)
```

---

## Referências

| Doc | Conteúdo |
| --- | --- |
| `EPICS_CLOSURE_JUN2026.md` | Status formal épicos |
| `CONTRATO_SAAS_ASSINATURA_PLATAFORMA.md` | Modelo contrato loja |
| `documentacao-tecnica.md` | Rastreabilidade |
| `regras-de-negocio.md` | BZ Growth Operations + trial |
