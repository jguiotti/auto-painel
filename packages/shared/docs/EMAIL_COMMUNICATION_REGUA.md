# Régua de comunicação por e-mail — AutoPainel

Documento squad (PM + UX Writer) para e-mails transacionais. **Status:** **Fase 1 entregue** (2026-06-17) — admin ADM-01/02 + convite colaborador com link por slug; **Fase 2 pendente** — whitelabel painel (Auth Hook).

**Relacionado:** `tenant_operator_journey` (PRD histórico), `regras-de-negocio.md` § Comunicação por e-mail.

---

## 1. Visão geral

| Canal | O quê | Hoje | Meta |
| --- | --- | --- | --- |
| **E-mail transacional Auth** | Convite, boas-vindas, recuperar senha | Templates genéricos Supabase; convite loja **não** envia e-mail automático para usuário novo | Marca AutoPainel (admin) ou marca da loja (painel) |
| **Notificações in-app** | Leads, cobrança atrasada | Sininho no painel/admin | Mantém in-app; e-mail opcional em fases futuras |
| **E-mail operacional manual** | URLs da loja pós-DNS | Operations envia manualmente | Modelo abaixo (§5) |

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
| **ADM-02 Recuperar senha** | Operador solicita em `/recuperar-senha` (a criar) ou Supabase | ❌ Página inexistente no admin | `resetPasswordForEmail` → template `recovery` |
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
| **LOJ-01 Boas-vindas / convite** | Colaborador criado em `inviteDealershipCollaboratorAction` | ✅ Sempre envia `resetPasswordForEmail` com host `{slug}.loja…` (marca AutoPainel no template Supabase) | Auth Hook whitelabel (Fase 2) |
| **LOJ-02 Recuperar senha** | `/recuperar-senha` no painel | ✅ `resetPasswordForEmail` — template **marca AutoPainel** (não whitelabel) | Template whitelabel por loja (Fase 2) |
| **LOJ-03 Senha alterada** | Após `/definir-senha` ou troca logado | Default Supabase | Template whitelabel |
| **LOJ-04 Conta desactivada** | `is_active=false` (CRM Fase D) | ❌ Não implementado | E-mail opcional fase 2 |

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

- Estados de login, recuperar senha, definir senha — e-mail é **continuação** da jornada; CTA do e-mail deve abrir `/auth/confirm?next=/definir-senha` no host correcto.

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

1. `inviteDealershipCollaboratorAction` — chamar envio de e-mail também para **usuário novo** (hoje só `linked_existing_user`).
2. Admin — criar `/recuperar-senha` + fluxo `/auth/confirm` + `/definir-senha`.
3. Templates HTML AutoPainel + Edge Function whitelabel painel.
4. SMTP produção (SendGrid/Resend) — `auth.email.smtp` no Supabase.

### 7.4 Critérios de aceite (QA)

| CA | Cenário |
| --- | --- |
| CA-EMAIL-01 | Convidar colaborador novo → e-mail LOJ-01 chega com logo da loja e link válido |
| CA-EMAIL-02 | Recuperar senha no painel → e-mail LOJ-02 com marca da loja |
| CA-EMAIL-03 | Convidar super_admin → e-mail ADM-01 marca AutoPainel |
| CA-EMAIL-04 | Link expirado → mensagem clara em `/definir-senha` |
| CA-EMAIL-05 | Host errado → não expõe dados de outra loja |

---

## 8. Cronograma sugerido (squad)

| Fase | Entrega |
| --- | --- |
| **1** | SMTP produção + templates admin estáticos (ADM-01, ADM-02) |
| **2** | Fix convite colaborador + template recovery admin |
| **3** | Auth Hook whitelabel painel (LOJ-01, LOJ-02) |
| **4** | Modelo OPS-01 na documentação operacional + optional SendGrid template |
| **5** | LOJ-04, e-mail lead/cobrança (backlog) |

---

*Documento squad — junho/2026. Fonte: `/squad` fases PM + UX Writer.*
