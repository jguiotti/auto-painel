# Régua de comunicação por e-mail — AutoPainel

Documento squad (PM + UX Writer) para e-mails transacionais. **Status:** **Fase 2 entregue** (2026-06-10) — e-mails Auth do painel (LOJ-01/02) e admin (ADM-02) via **Resend** + `auth.admin.generateLink` (sem template Supabase SMTP). Fallback SMTP Supabase permanece para casos sem `RESEND_API_KEY`.

**Relacionado:** `tenant_operator_journey` (PRD histórico), `regras-de-negocio.md` § Comunicação por e-mail, `EMAIL_RESEND_SETUP.md`.

---

## 1. Visão geral

| Canal | O quê | Hoje | Meta |
| --- | --- | --- | --- |
| **E-mail transacional Auth** | Convite, boas-vindas, recuperar senha | **Resend** + HTML whitelabel (loja ou AutoPainel); link via `generateLink` | Mantém régua abaixo; LOJ-04 e lead por e-mail em fases futuras |
| **Notificações in-app** | Leads, cobrança atrasada | Sininho no painel/admin | Mantém in-app; e-mail opcional em fases futuras |
| **E-mail operacional manual** | URLs da loja pós-DNS | Operations envia manualmente | Modelo abaixo (§5) |

### Matriz rápida (marca × evento)

| ID | Evento | Disparado de | Marca visual | Assunto (resumo) |
| --- | --- | --- | --- | --- |
| **LOJ-01** | Boas-vindas / convite colaborador | Admin ou painel `/painel/equipe` | **Loja** (logo + cor) | `{Loja} — seu acesso ao painel da loja` |
| **LOJ-02** | Recuperar senha | Painel `/recuperar-senha` | **Loja** | `{Loja} — redefinir senha do painel` |
| **LOJ-04** | Exclusão / desativação perfil | Painel (futuro) | **Loja** | Pendente |
| **ADM-01** | Boas-vindas operador | Script provision (futuro UI) | **AutoPainel** (logo color) | `Bem-vindo(a) ao Admin AutoPainel` |
| **ADM-02** | Recuperar senha | Admin `/recuperar-senha` | **AutoPainel** | `Redefinir senha — Admin AutoPainel` |
| **TRIAL-01** | Onboarding trial | Marketing `/adesao-trial` | **AutoPainel** | Trial adesão |
| **LEAD-01** | Novo lead (futuro) | Edge worker / painel | **Loja** | Pendente (hoje só in-app) |

---

## 2. Regras de negócio (PM)

| ID | Regra |
| --- | --- |
| **BZ-EMAIL-001** | E-mails de **Auth do admin-master** usam identidade visual **AutoPainel** (logo, cores institucionais, remetente `@autopainel.com.br`). |
| **BZ-EMAIL-002** | E-mails de **Auth do painel da loja** usam identidade da **concessionária** conforme `content_config` / `theme_config`: logo, nome da loja, `storefront_theme_mode` (claro/escuro define paleta do template). |
| **BZ-EMAIL-003** | Ao cadastrar colaborador no admin (aba Equipe), o usuário **deve** receber e-mail para **definir senha** — sem depender do operador copiar senha temporária. |
| **BZ-EMAIL-004** | Recuperação de senha (`/recuperar-senha`) **deve** disparar e-mail com a mesma marca do contexto (admin vs loja). |
| **BZ-EMAIL-005** | Links de e-mail Auth **devem** apontar para o host correto: `admin.autopainel.com.br` (admin) ou `{slug}.loja.autopainel.com.br` (painel). |
| **BZ-EMAIL-006** | Nunca incluir senha temporária em texto plano no e-mail — apenas link seguro com expiração (padrão Supabase: 1 h). |
| **BZ-EMAIL-007** | Remetente: `AutoPainel <noreply@autopainel.com.br>` (admin); `{Nome da Loja} via AutoPainel <noreply@autopainel.com.br>` (painel) — reply-to opcional `contact_email` da loja. |
| **BZ-EMAIL-008** | Idioma: **pt-BR** em todos os corpos e assuntos. |

### Fora de escopo (v1 desta régua)

- E-mail marketing / newsletters
- NF-e, recibo por e-mail ao comprador
- Notificação por e-mail de **novo lead** (permanece in-app v1)
- E-mail automático de cobrança SaaS atrasada (permanece in-app v1)

---

## 3. Régua — Admin Master (marca AutoPainel)

### 3.1 Disparadores

| Evento | Quando | Mecanismo actual | Mecanismo alvo |
| --- | --- | --- | --- |
| **ADM-01 Boas-vindas / convite** | Novo `super_admin` criado (`provision:super-admin` ou UI futura) | ❌ Sem e-mail; senha no terminal | `inviteUserByEmail` ou `resetPasswordForEmail` + template `invite` |
| **ADM-02 Recuperar senha** | Operador solicita em `/recuperar-senha` | ✅ `requestAdminPasswordRecoveryAction` → Resend **ADM-02** (logo color admin) | — |
| **ADM-03 Senha alterada** | Após `/painel/conta/senha` | Template Supabase default (se activo) | Template `password_changed` |
| **ADM-04 Confirmar e-mail** | Mudança de e-mail (futuro) | Supabase default | Template `email_change` |

### 3.2 Copy — ADM-01 Boas-vindas (convite operador)

**Assunto:** `Bem-vindo(a) ao Admin AutoPainel — defina sua senha`

**Pré-header:** Acesso exclusivo para a equipe da plataforma.

**Corpo (resumo):**

> Olá, {{nome}}!
>
> Sua conta de operador da **AutoPainel** foi criada. Para acessar o painel central em **admin.autopainel.com.br**, defina sua senha clicando no botão abaixo.
>
> **[Definir minha senha]** → link `{{ .ConfirmationURL }}`
>
> Este link expira em 1 hora. Se você não solicitou este acesso, ignore este e-mail.
>
> — Equipe AutoPainel  
> autopainel.com.br

### 3.3 Copy — ADM-02 Recuperar senha

**Assunto:** `Redefinir senha — Admin AutoPainel`

**Corpo (resumo):**

> Olá!
>
> Recebemos um pedido para redefinir a senha da sua conta no **Admin AutoPainel**.
>
> **[Criar nova senha]** → `{{ .ConfirmationURL }}`
>
> Se não foi você, ignore este e-mail — sua senha permanece a mesma.
>
> — AutoPainel

### 3.4 Identidade visual (admin)

| Elemento | Valor |
| --- | --- |
| Logo | `LOGO_DESTAQUES` / horizontal AutoPainel (hosted CDN ou embed) |
| Cor primária | Verde institucional / zinc escuro (marketing-site) |
| Fundo | Claro (#fafafa) ou dark (#09090b) — preferir **claro** em e-mail |
| Rodapé | © AutoPainel · link autopainel.com.br · texto legal curto |

---

## 4. Régua — Painel da loja (marca da concessionária)

### 4.1 Disparadores

| Evento | Quando | Mecanismo actual | Mecanismo alvo |
| --- | --- | --- | --- |
| **LOJ-01 Boas-vindas / convite** | Colaborador criado (admin ou painel `/painel/equipe`) | ✅ `sendDealershipWelcomeEmail` → Resend **LOJ-01** (logo + cor da loja) | — |
| **LOJ-02 Recuperar senha** | `/recuperar-senha` no painel | ✅ `requestDealershipPasswordRecoveryAction` → Resend **LOJ-02** (marca da loja) | — |
| **LOJ-03 Senha alterada** | Após `/definir-senha` ou troca logado | Default Supabase | Template whitelabel |
| **LOJ-04 Conta desativada** | Titular remove colaborador em `/painel/equipe` | ✅ `sendDealershipMemberDeactivatedEmail` → Resend **LOJ-04** | — |

### 4.2 Variáveis de personalização (por tenant)

| Variável | Fonte |
| --- | --- |
| `{{nome_loja}}` | `dealerships.name` |
| `{{logo_url}}` | `theme_config.header_logo_url` ou `dealerships.logo_url` |
| `{{url_painel}}` | `https://{slug}.loja.autopainel.com.br` |
| `{{tema}}` | `storefront_theme_mode`: `light` \| `dark` (paleta do template HTML) |
| `{{nome_usuario}}` | `user_metadata.full_name` |
| `{{papel}}` | owner / manager / seller (texto pt-BR no corpo) |

### 4.3 Copy — LOJ-01 Boas-vindas (convite colaborador)

**Assunto:** `{{nome_loja}} — seu acesso ao painel da loja`

**Pré-header:** Defina sua senha para começar.

**Corpo (resumo):**

> Olá, {{nome_usuario}}!
>
> Você foi convidado(a) para acessar o painel da **{{nome_loja}}** como **{{papel_label}}**.
>
> **[Ativar meu acesso]** → `{{ .ConfirmationURL }}`  
> (abre em {{url_painel}})
>
> No painel você pode gerenciar estoque, leads e integrações conforme seu perfil de acesso.
>
> Dúvidas? Fale com o responsável pela sua loja ou responda este e-mail se disponível.
>
> — {{nome_loja}}  
> Tecnologia AutoPainel

**Labels de papel (`papel_label`):**

| role | Copy |
| --- | --- |
| `owner` | titular da loja |
| `manager` | gestor(a) |
| `seller` | vendedor(a) |

### 4.4 Copy — LOJ-02 Recuperar senha

**Assunto:** `{{nome_loja}} — redefinir senha do painel`

**Corpo (resumo):**

> Olá!
>
> Recebemos um pedido para redefinir a senha do painel da **{{nome_loja}}**.
>
> **[Criar nova senha]** → `{{ .ConfirmationURL }}`
>
> Se não foi você, ignore este e-mail.
>
> — {{nome_loja}}

### 4.5 Identidade visual (loja)

| `storefront_theme_mode` | Fundo e-mail | Texto | Botão CTA |
| --- | --- | --- | --- |
| **light** | #ffffff | #18181b | cor primária da loja ou verde AP |
| **dark** | #18181b | #fafafa | contraste AA |

- Logo da loja no topo (max 200px largura)
- Rodapé discreto: «Plataforma AutoPainel» + link vitrine `https://{slug}.autopainel.com.br`

---

## 5. Régua operacional manual (Operations)

Do PRD `tenant_operator_journey` — **não é Auth automático**, enviado pela equipe após DNS estável.

### OPS-01 Entrega da loja ao cliente

**Assunto:** `Sua loja {{nome_loja}} está no ar — acesse vitrine e painel`

**Quando:** Após `dealership:hosts:provision` + DNS OK + convite colaborador.

**Corpo (resumo):**

> Olá, {{nome_gestor}}!
>
> A **{{nome_loja}}** já está disponível na AutoPainel.
>
> **Vitrine (site público):** {{url_vitrine}}  
> **Painel da loja:** {{url_painel}}  
> **Login:** use o e-mail {{email_gestor}} — você receberá (ou já recebeu) um e-mail separado para definir a senha.
>
> Guarde estes endereços nos favoritos do navegador.
>
> Qualquer dúvida, responda este e-mail.
>
> — Equipe AutoPainel

---

## 6. Outras indicações nos comandos squad (futuro / adjacentes)

### `/prd` e PRDs históricos

| Indicação | Tipo | Prioridade |
| --- | --- | --- |
| E-mail pós-DNS com URLs (CA-TOJ / checklist Operations) | Manual OPS-01 | **Alta** (operacional) |
| Login/recuperação linguagem simples (BZ-TOJ-010) | In-app + e-mail | **Alta** (copy já acima) |
| Notificar gestor quando Meta precisa reconnect (BZ-007 integrações) | In-app hoje; e-mail fase 2 | Média |
| Recibo/NF-e por e-mail ao comprador | Fora de escopo v1 recibo | Baixa |

### `/uxwriter`

- Não lista e-mails transacionais explicitamente; princípios aplicáveis: **clareza**, **pt-BR**, **multi-tenant** (`{{nome_loja}}`), erros com acção.
- Notificações in-app (leads, cobrança) já têm copy — **não duplicar** por e-mail na v1 salvo opt-in futuro.

### `/ux`

- Estados de login, recuperar senha, definir senha — e-mail é **continuação** da jornada; CTA do e-mail abre `/auth/confirm` no host correcto (allowlist Supabase **sem** query string); após confirm, redirect para `/definir-senha?motivo=primeiro-acesso`.

### `/marketing` (`.cursor/commands/marketing.md`)

- E-mail prospecção B2B (cold) — **marketing comercial**, não transacional Auth.
- Lead do formulário `/contato` — fluxo comercial interno, não régua Auth.

### Notificações in-app (não confundir com e-mail)

| Evento | Superfície | Canal actual |
| --- | --- | --- |
| Novo lead vitrine | Painel loja | Sininho (Realtime) |
| Cobrança atrasada / loja suspensa | Admin | Sininho |
| Lead atribuído a vendedor | Painel | In-app (CRM) |

---

## 8. Régua — Campanha trial e vendas B2B (jun/2026)

Complementa §3–§4 para prospecção ativa, trial Essencial e conversão comercial. **Canal alvo:** Resend (`noreply@autopainel.com.br`) + fila interna (fase 2). **Métrica:** taxa de abertura + clique no CTA principal; **prazo de validação:** 48 h após cada template publicado.

### 8.1 Matriz de disparo (regras)

| ID | Evento | Quando dispara | Destinatário | Bloqueio / dedupe | Prioridade |
| --- | --- | --- | --- | --- | --- |
| **TRIAL-01** | Adesão trial recebida (vaga imediata) | `submit_dealership_onboarding_intake` + `campaign.setup_fee_waived=true` | E-mail do representante legal | 1 e-mail / intake / 24 h | Alta |
| **TRIAL-02** | Fila de espera trial | Mesmo RPC + `campaign.trial_waitlist=true` | Mesmo | 1 e-mail / intake | Média |
| **TRIAL-03** | Trial ativado (go-live) | Admin converte intake → loja `trialing` | Gestor + e-mail comercial da loja | 1 e-mail / dealership | Alta |
| **TRIAL-04** | Trial D-7 | Cron: `trial_ends_at - 7 dias` | Gestor da loja | 1 por ciclo trial | Alta |
| **TRIAL-05** | Trial D-1 | Cron: `trial_ends_at - 1 dia` | Gestor | 1 por ciclo | Alta |
| **TRIAL-06** | Trial encerrado sem contrato | Status → `paused`/`churned` pós-trial | Gestor + comercial interno | 1 | Média |
| **SALES-01** | Lead comercial manual | Admin `createPlatformCommercialLeadAction` | **Interno:** ops@ ou Slack — **não** e-mail ao prospect | — | Baixa |
| **SALES-02** | Proposta / contrato rascunho | `platform_contracts.status=draft` + `saas_prospect_id` | Comercial interno (opcional) | — | Baixa |
| **SALES-03** | Contrato enviado p/ assinatura | `sent_for_signature` | Contratante (`counterparty_email`) | 1 / contrato | Alta |
| **SALES-04** | Contrato assinado | `signed` | Contratante + gestor + ops | 1 | Alta |
| **SALES-05** | Loja criada pós-lead | `linkCommercialLeadToDealershipAction` | Gestor (LOJ-01 convite senha) **antes** de TRIAL-03 | LOJ-01 substitui duplicata | Alta |
| **MKT-01** | Formulário contato site | `submitSaasProspectAction` | Prospect (confirmação) + alerta interno | 1 / e-mail / 1 h | Média |
| **MKT-02** | WhatsApp float lead | `lead_channel=whatsapp_float` | Interno comercial | dedupe 24 h | Média |

### 8.2 Regras de negócio (disparo)

| ID | Regra |
| --- | --- |
| **BZ-EMAIL-TR-001** | **TRIAL-01** e **TRIAL-02** são mutuamente exclusivos no mesmo intake. |
| **BZ-EMAIL-TR-002** | Nunca enviar **TRIAL-03** sem **LOJ-01** (convite senha) ter sido disparado ou agendado no mesmo batch. |
| **BZ-EMAIL-TR-003** | **TRIAL-04/05** só para lojas com `subscription_status=trialing` e sem contrato `signed`. |
| **BZ-EMAIL-TR-004** | **SALES-03** usa template `saas-acquisition` (contrato comercial), **nunca** `trial-adhesion`. |
| **BZ-EMAIL-TR-005** | `trial-adhesion` é termo informativo; e-mail **TRIAL-01** linka `/termo-adesao-trial`, não PDF de contrato. |
| **BZ-EMAIL-TR-006** | Horário comercial BR (08h–20h America/Sao_Paulo) para e-mails ao lojista; transacionais Auth (LOJ/ADM) sem restrição. |
| **BZ-EMAIL-TR-007** | Opt-out marketing não bloqueia transacionais de trial/contrato (base legal: execução contratual + legítimo interesse B2B). |

### 8.3 Copy resumido — TRIAL-01 (adesão recebida)

**Assunto:** `Recebemos sua adesão ao trial AutoPainel — próximo passo em até 1 dia útil`

**CTA:** Aguardar contato (sem link) · **Rodapé:** link `/termo-adesao-trial` · **Métrica:** resposta comercial em ≤1 dia útil (manual até automação CRM).

### 8.4 Copy resumido — TRIAL-02 (fila de espera)

**Assunto:** `Você entrou na fila do trial Essencial — avisaremos quando abrir vaga`

**Corpo:** vagas limitadas (20 setup isento) · **CTA:** nenhum · **Métrica:** conversão fila → TRIAL-01 quando vaga liberada.

### 8.5 Copy resumido — SALES-03 (contrato comercial)

**Assunto:** `Contrato AutoPainel — {{nome_loja}} · assinatura pendente`

**Anexo / link:** provedor de assinatura · **Template DB:** `Contrato SaaS — Licença de Uso e Assinatura (comercial)`.

### 8.6 Implementação sugerida (fases)

| Fase | Escopo | Prazo |
| --- | --- | --- |
| **1** | Auth ADM/LOJ (§3–§4) + Resend SMTP Supabase | Imediato |
| **2** | Edge Function `send-transactional-email` + tabela `email_outbox` (idempotency key) | Pós trial go-live |
| **3** | Cron trial D-7/D-1 via Supabase pg_cron ou Vercel Cron | Pós 10 lojas trial |

### 8.7 Próximo passo operacional

1. Publicar templates HTML TRIAL-01/02 e SALES-03 no Resend.  
2. Ligar **TRIAL-01/02** em `submit-trial-onboarding.ts` (após RPC sucesso). ✅ **Entregue** — `apps/marketing-site/src/lib/email/send-trial-onboarding-email.ts` (best-effort; não falha o submit).
3. GTM evento `transactional_email_sent` (opcional) — ver `GTM_EVENTS.md`.

---

## 7. Implementação técnica (resumo para DevOps / Backend)

### 7.1 Opções Supabase Auth

| Abordagem | Prós | Contras |
| --- | --- | --- |
| **A. Templates estáticos** em `supabase/templates/` | Simples para admin | Não whitelabel por loja |
| **B. Auth Hook `send_email`** (Edge Function) | HTML dinâmico por tenant | Mais código; recomendado para LOJ-* |
| **C. SMTP + SendGrid/Resend** com templates | Controlo total | Config extra |

**Recomendação:** **A** para admin (ADM-*); **B** para painel (LOJ-*).

### 7.2 Redirect URLs (Supabase Dashboard)

```
https://admin.autopainel.com.br/auth/confirm**
https://*.loja.autopainel.com.br/auth/confirm**
https://*.loja.autopainel.com.br/**
```

### 7.3 Gap de código (prioridade)

1. `inviteDealershipCollaboratorAction` — envio de e-mail para usuário novo (verificar estado actual).
2. Admin — `/recuperar-senha`, `/auth/confirm`, `/definir-senha` ✅ implementados; validar SMTP Resend em produção.
3. Templates HTML AutoPainel + Edge Function whitelabel painel.
4. SMTP produção (Resend) — `auth.email.smtp` no Supabase.
5. Disparos **TRIAL-01/02** e **SALES-03** — ver §8 (**TRIAL-01/02** ✅ marketing-site + Resend).

### 7.4 Critérios de aceite (QA)

| CA | Cenário |
| --- | --- |
| CA-EMAIL-01 | Convidar colaborador novo → e-mail LOJ-01 chega com logo da loja e link válido |
| CA-EMAIL-02 | Recuperar senha no painel → e-mail LOJ-02 com marca da loja |
| CA-EMAIL-03 | Convidar super_admin → e-mail ADM-01 marca AutoPainel |
| CA-EMAIL-04 | Link expirado → mensagem clara em `/definir-senha` |
| CA-EMAIL-05 | Host errado → não expõe dados de outra loja |

---

## 9. Cronograma sugerido (squad)

| Fase | Entrega |
| --- | --- |
| **1** | SMTP produção + templates admin estáticos (ADM-01, ADM-02) |
| **2** | Fix convite colaborador + template recovery admin |
| **3** | Auth Hook whitelabel painel (LOJ-01, LOJ-02) |
| **4** | Modelo OPS-01 na documentação operacional + optional SendGrid template |
| **5** | LOJ-04, e-mail lead/cobrança (backlog) |
| **6** | TRIAL-01…06 + SALES-03/04 (§8) |

---

*Documento squad — junho/2026. Fonte: `/squad` fases PM + UX Writer.*
