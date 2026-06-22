# QA — Campanha trial Essencial (jun/2026)

Roteiro de validação pós-implementação (Fase 8). Critérios de negócio: `apps/admin-master/content/internal-docs/regras-de-negocio.md` (BZ-TR-001…006).

**Pré-requisitos:** migrações `20260622120000` + `20260622140000` aplicadas; `SUPABASE_SERVICE_ROLE_KEY` no Vercel marketing-site; GTM publicado com evento `trial_onboarding_submit`.

---

## 1. Marketing — `/planos` e campanha

| Teste | Given | When | Then | Status |
| --- | --- | --- | --- | --- |
| Matriz Essencial trial | Catálogo publicado | Abrir `/planos` | Essencial: Simulador, QR, Métricas ✓; iCarros/Meta «Em breve» | [ ] |
| CTA trial Essencial | Plano Essencial visível | Clicar «Começar trial grátis» | Navega para `/adesao-trial`; GTM `cta_click` plan_card_starter | [ ] |
| Núcleo operacional home | Home carregada | Scroll seção «Do pátio ao fechamento» | Estoque + contatos com «Incluso em todos os planos» | [ ] |
| Funcionalidades operação | `/funcionalidades` | Anchor `#operacao-comercial` | Dois cards estoque + contatos antes dos demais grupos | [ ] |

---

## 2. Formulário `/adesao-trial`

| Teste | Given | When | Then | Status |
| --- | --- | --- | --- | --- |
| Wizard passos | Formulário aberto | Preencher passo 0 inválido → Continuar | Erro inline; não avança | [ ] |
| Máscaras CNPJ/CPF | Passo 0 | Digitar CNPJ/CPF | Máscara BR aplicada | [ ] |
| Layout preview | Passo 3 vitrine | Selecionar layout 1/2/3 | Picker visual + campos sidecard só layout 1 | [ ] |
| Upload hero | Arquivo JPG ≤5MB | Enviar adesão | Intake criado; URL hero no payload | [ ] |
| Lead automático | Sem `?saas_prospect_id=` | Enviar adesão completa | `saas_prospects` source=trial_onboarding; intake status=linked | [ ] |
| Reenvio vinculado | URL `?saas_prospect_id=uuid` | Enviar | RPC usa prospect existente; sem duplicar lead | [ ] |
| GTM conversão | GTM Preview ativo | Sucesso pós-envio | `trial_onboarding_submit` no dataLayer | [ ] |
| Mobile sticky CTA | Viewport &lt;768px | Passo intermediário | Footer «Continuar» sticky visível | [ ] |

---

## 3. Admin — conversão

| Teste | Given | When | Then | Status |
| --- | --- | --- | --- | --- |
| Fila adesões | Intake submitted | `/painel/adesoes-trial` | Linha com badge status; «Converter em loja» | [ ] |
| Prefill nova loja | Intake com payload | `/painel/concessionarias/nova?intake=` | Banner verde; form pré-preenchido; storefront_home | [ ] |
| Criar loja trial | Form preenchido | Salvar concessionária | RPC `mark_dealership_onboarding_intake_converted`; subscription trialing | [ ] |
| Vincular lead | Intake sem prospect | Dialog vincular | RPC link; status linked | [ ] |
| Arquivar | Intake ativo | Arquivar | status archived; some da fila | [ ] |
| Lead comercial | Lead com metadata.intake_id | `/painel/leads-comerciais` | «Ver adesão» → nova?intake= | [ ] |

---

## 4. Vitrine pós-conversão

| Teste | Given | When | Then | Status |
| --- | --- | --- | --- | --- |
| Layouts 1–3 | Loja convertida com copy intake | Abrir vitrine | Hero, trust, finance, heritage renderizados | [ ] |
| Legal LGPD | `/politica-de-privacidade` | Ler texto | Controladora = loja; operadora/detentora = AutoPainel | [ ] |

---

## 5. Isolamento tenant (mandatório)

| Actor | Ação | Próprio tenant | Outro tenant |
| --- | --- | --- | --- |
| anon | `submit_dealership_onboarding_intake` | ✅ cria intake | N/A |
| authenticated admin | SELECT intakes | ✅ todos (super admin) | ✅ (plataforma) |
| dealership user | SELECT leads | ✅ só dealership_id | ❌ 0 rows RLS |
| anon | SELECT `dealership_onboarding_intakes` | ❌ | ❌ |

---

## 6. GTM — cobertura de tag

| Teste | Given | When | Then | Status |
| --- | --- | --- | --- | --- |
| Snippet sempre presente | `NEXT_PUBLIC_GTM_ID` definido | Abrir qualquer rota (incl. painel autenticado) | `googletagmanager.com/gtm.js` no HTML | [ ] |
| Tráfego interno | IP em `GA4_INTERNAL_TRAFFIC_IPS` | Abrir página | GTM carrega; `ap_internal_traffic=true`; `__AP_ANALYTICS_EXCLUDED` | [ ] |
| Exclusão GA4 | GTM configurado | Hit interno | Tags GA4 **não** disparam (trigger exceção `ap_internal_traffic`) | [ ] |
| URLs reportadas | Cobertura GTM | Re-scan após deploy | 8 URLs «Sem tag» → «Com tag» (ver lista abaixo) | [ ] |

**URLs que falhavam na cobertura (jun/2026):**

- `admin…/painel/planos/{id}/editar`
- `demo-2.loja…/painel/estoque/{id}/editar`
- `demo-3.loja…/painel/estoque/{id}/editar`
- `demo…/termos-de-uso`
- `guiotti.loja…/painel/equipe`

**Causa raiz corrigida:** tráfego interno omitia o snippet GTM. Agora o container carrega sempre; exclusão via `ap_internal_traffic` + filtros GTM/GA4.

---

## 7. Findings template

| # | Severidade | Descrição | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | | | | open |

---

## Referências

- Arquitetura: `TRIAL_CAMPAIGN_ARCHITECTURE.md`
- UX Copy: `TRIAL_ONBOARDING_UX_COPY.md`
- GTM: `GTM.md`, `GTM_EVENTS.md`
