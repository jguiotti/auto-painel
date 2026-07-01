# Meta (Facebook / Instagram) — integração simplificada

Plano de produto e arquitetura para substituir o fluxo «App ID / App Secret por loja» por um **Connect** de um clique, adequado a gestores não técnicos.

**Decisão PM (2026-06-10):** repensar integração Meta; prioridade de entrega = **workers de publicação** antes do redesign mobile dos painéis.

---

## 1. Problema do modelo actual (Modelo B)

| Aspecto | Hoje | Impacto |
| --- | --- | --- |
| Credenciais | Formulário `MetaDeveloperAppForm` — App ID + App Secret por concessionária | Gestor precisa conta Meta for Developers |
| Copy | Página Integrações diz «não precisa configurar nada técnico», mas exige formulário | Confiança quebrada |
| Operação | Cada loja cria/revisa app Meta | Homologação Meta repetida por cliente |
| Código | `dealership_meta_oauth_apps` + fallback `META_APP_*` | Dois caminhos de config |

---

## 2. Modelo alvo — **Connect da plataforma** (Modelo A+)

A **AutoPainel** possui **uma** aplicação Meta (Business) em produção. A loja só autoriza acesso à **Página do Facebook** e conta **Instagram Business** ligada.

```
Gestor da loja                    AutoPainel                         Meta
     │                                │                                │
     │  [Conectar Facebook]           │                                │
     ├──────────────────────────────►│  OAuth (app plataforma)        │
     │                                ├───────────────────────────────►│
     │                                │◄───────────────────────────────┤
     │  Escolhe Página + IG (se >1)   │  tokens long-lived por loja    │
     │◄──────────────────────────────┤  em dealership_meta_*          │
     │  «Conectado: Loja X @loja»     │                                │
```

### O que o gestor vê (3 passos)

1. **Conectar** — botão único; janela de login Meta (popup).
2. **Escolher página** — se tiver mais de uma Página, lista simples (nome + foto); se só uma, avanço automático.
3. **Pronto** — card verde: Página + @Instagram; botão **Desconectar** e link «Como funciona?».

### O que desaparece da UI do painel

- Campos App ID / App Secret / versão Graph API.
- Referências a «Meta for Developers».

### O que permanece no backend

- Tabelas existentes: `dealership_meta_connections`, `dealership_meta_credentials`, `dealership_meta_oauth_sessions`, `social_publication_jobs`.
- Edge `meta-oauth-callback` — passa a usar **sempre** credenciais da plataforma em produção.
- Tabela `dealership_meta_oauth_apps` — **legado / override enterprise** (opcional futuro); não exposta na UI padrão.

---

## 3. Segredos e configuração

| Variável | Onde | Quem configura |
| --- | --- | --- |
| `META_APP_CLIENT_ID` | Supabase secrets + `.env.local` dev | Equipa AutoPainel (uma vez) |
| `META_APP_CLIENT_SECRET` | Supabase secrets | Equipa AutoPainel |
| `META_OAUTH_REDIRECT_URI` | Edge callback URL fixa | DevOps |
| `META_TOKENS_CRYPTO_SECRET` | Cifra tokens em repouso | DevOps |
| `META_GRAPH_API_VERSION` | Opcional (default estável) | DevOps |

**Redirect URL registada na app Meta:**  
`https://<project-ref>.supabase.co/functions/v1/meta-oauth-callback`

**App Review Meta (uma vez):** permissões mínimas sugeridas:

- `pages_show_list`, `pages_read_engagement`
- `pages_manage_posts` (publicar no Facebook)
- `instagram_basic`, `instagram_content_publish`
- `business_management` (ligar Page ↔ IG Business)

---

## 4. Regras de negócio (BZ)

| ID | Regra |
| --- | --- |
| **BZ-META-S01** | Em produção, OAuth Meta usa **exclusivamente** a app da AutoPainel; gestor da loja **não** insere App ID/Secret. |
| **BZ-META-S02** | Tokens e IDs de página/IG ficam isolados por `dealership_id` (RLS + credenciais só service role). |
| **BZ-META-S03** | Desconectar apaga tokens da loja e marca `status = disconnected`; jobs em fila falham com mensagem «Reconecte a conta». |
| **BZ-META-S04** | Publicação exige conexão `connected` + veículo ativo com ≥ 1 foto. |
| **BZ-META-S05** | Módulo `social_media_kit` continua a gatear menu Integrações e ações de share. |

---

## 5. Fases de implementação (dentro do Épico 2)

| Fase | Entrega | Dependência |
| --- | --- | --- |
| **2-M1** | Config: `resolveMetaAppRuntimeConfig` prioriza env plataforma; feature flag `META_PLATFORM_APP_ONLY=true` | ✅ entregue |
| **2-M2** | UI: substituir `MetaDeveloperAppForm` por card **Conectar** + estados (wizard 3 passos) | ✅ entregue (`META_PLATFORM_APP_ONLY=true`) |
| **2-M3** | Callback: pós-OAuth, resolver `page_id` + `ig_user_id`; UI seletor se múltiplas páginas | ✅ entregue |
| **2-M4** | Worker `social-publish-worker` — MVP **imagem única** + legenda (sem carrossel Sharp) | ✅ entregue |
| **2-M5** | Render carrossel 1080×1080 (Sharp em Route Handler Next ou serviço dedicado) + templates classic/performance/tech | ✅ entregue |
| **2-M6** | Checkbox «Divulgar ao salvar» no formulário de veículo | ✅ entregue (`Salvar e divulgar`) |

**Nota técnica Sharp:** Supabase Edge (Deno) não é ideal para Sharp. ADR recomendada: **Route Handler** em `dealership-panel` ou `admin-master` com service role, ou worker externo; Edge consome URL da imagem já renderizada.

---

## 6. Cenários de aceite (CA)

| ID | Cenário |
| --- | --- |
| **CA-META-S01** | Given loja com `social_media_kit` — When abre Integrações — Then vê botão **Conectar com Facebook** sem campos App ID/Secret. |
| **CA-META-S02** | Given OAuth concluído — When uma Página e IG Business existem — Then card mostra nomes e status **Conectado**. |
| **CA-META-S03** | Given conectado — When publica veículo via worker — Then job passa `queued` → `published` ou `failed` com mensagem amigável. |
| **CA-META-S04** | Given loja A conectada — When loja B consulta integrações — Then **não** vê tokens/dados da loja A. |

---

## 7. Fora de escopo (esta fase)

- App Meta separada por concessionária (modelo B) na UI padrão.
- Stories, Reels, Ads Manager.
- Agendamento de posts.
- Onboarding Meta assistido por vídeo-chamada (processo comercial manual, não produto).

---

## 8. Meta Dashboard — onde configurar (developers.facebook.com)

**Project ref Supabase (AutoPainel remoto):** `wcgevmvystdhqpzwuyig`  
**Redirect URI canónica (copiar/colar, sem espaços nem barra final):**

```text
https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/meta-oauth-callback
```

Refs **errados** que já apareceram por typo — **não usar**: `wcgevmvystohqpzwuyig`, `wcgevnvystdhgpzwzyjg`.

### 8.1 Login do Facebook para empresas → Configurações (obrigatório para OAuth)

Menu lateral: **Login do Facebook para empresas** → **Configurações**.

| Campo | Valor |
| --- | --- |
| Login no OAuth do cliente | **Sim** |
| Login do OAuth na Web | **Sim** |
| Forçar HTTPS | **Sim** |
| Usar modo estrito para URIs de redirecionamento | **Sim** |
| **URIs de redirecionamento do OAuth válidos** | Colar a URI canónica acima (uma linha) |

**Validador da URI:** só confirma depois de **Salvar alterações** (canto inferior direito). Se a URI já está na lista mas o validador falha:

1. Clicar **Salvar alterações**
2. Recarregar a página (Cmd+Shift+R)
3. Colar de novo a URI no validador → **Verificar URI**
4. Se persistir: apagar a linha da lista, salvar, adicionar de novo, salvar, validar

Não use a página **Modelos** — templates de parceiro WhatsApp/Instagram não são o fluxo AutoPainel.

### 8.2 Configurações do app → Avançado (alinhar URLs legadas)

Menu lateral: **Configurações do app** → **Avançado**.

Dois blocos distintos — **ambos** devem apontar para a mesma URI canónica (ou ficar vazios se não forem usados):

| Secção no ecrã | Campo | Acção |
| --- | --- | --- |
| **Autenticação do aplicativo** | **Autorizar URL de retorno de chamada** | Substituir qualquer URL com ref errado pela URI canónica |
| **Compartilhar** (rodapé da página) | **Lista de permissão de domínios para redirecionamento de compartilhamentos** | Manter só a URI canónica (remover entradas com ref errado) |

Depois: **Salvar alterações** no rodapé.

> O OAuth do AutoPainel usa o produto **Login do Facebook para empresas** (§8.1). Avançado evita redirects inconsistentes noutros fluxos Meta.

### 8.3 Configurações do app → Básico

| Campo | AutoPainel |
| --- | --- |
| ID do aplicativo | `META_APP_CLIENT_ID` no `.env.local` |
| Chave secreta | `META_APP_CLIENT_SECRET` |
| Domínios do aplicativo | `autopainel.com.br` |
| Política de privacidade | `https://autopainel.com.br/politica-de-privacidade` |
| Exclusão de dados | `https://autopainel.com.br/exclusao-de-dados` |

### 8.4 Publicado vs App Review

| Estado | Significado |
| --- | --- |
| **Publicado** (Live) | App fora do modo Development restrito; OAuth abre para utilizadores em geral |
| **Análise do app** (App Review) | Cada **permissão avançada** precisa de submissão e aprovação Meta |

**Publicado ≠ permissões aprovadas.** Enquanto permissões como `pages_manage_posts` e `instagram_content_publish` estiverem em **«Não enviado»**, só contas com **função no app** (Administrador, Desenvolvedor, Testador) + Facebook ligado a essa função usam publicação real.

**Submeter só o mínimo AutoPainel** (Analisar → Análise do app → Avançar):

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`
- `business_management`

**Não submeter** (remover do pedido se possível): WhatsApp, `leads_retrieval`, `catalog_management`, comentários IG, etc. — não fazem parte do escopo actual.

**Teste antes da aprovação:** em **Funções do app → Testadores**, adicionar o Facebook do gestor demo; Connect + dry-run (`SOCIAL_PUBLISH_DRY_RUN=true`) no painel.

**Após aprovação:** `SOCIAL_PUBLISH_DRY_RUN=false` na Edge + `npm run supabase:deploy` (republica `social-publish-worker`).

### 8.5 Erro «Invalid Scopes» no popup Facebook

Mensagem típica (só devs veem): `Invalid Scopes: pages_manage_posts, instagram_basic, instagram_content_publish`.

**Causa:** a app Meta **não tem essas permissões activadas** nos **Casos de uso** — não é bug do AutoPainel nem da redirect URI.

**Correcção no Meta Developers (app AutoPainel):**

1. Menu **Casos de uso** (Use cases).
2. Abrir **«Gerir tudo na sua Página»** (Manage everything on your Page) → **Personalizar** → **Permissões e funcionalidades**.
3. Garantir **«Pronto para teste»** (Ready for testing) em:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_manage_metadata` (recomendado)
4. Abrir caso de uso **Instagram** / publicação de conteúdo (nome varia) → **Personalizar** → activar:
   - `instagram_basic`
   - `instagram_content_publish`
5. Caso de uso **Business** / contas empresariais → `business_management` em **Pronto para teste**.
6. **Salvar** em cada ecrã; voltar a **Login do Facebook para empresas → Configurações** e confirmar redirect URI.

**Teste:** conta Facebook usada no popup deve ser **Administrador/Desenvolvedor/Testador** do app (Funções do app). Modo Development/Live com «Pronto para teste» basta — App Review só para utilizadores externos.

**Override temporário (opcional):** `META_OAUTH_SCOPES` no `.env.local` com subset mínimo para isolar permissão em falta — depois `npm run sync:env` + `integration:secrets:configure`.

### 8.6 Loja demo para App Review Meta (produção)

Migração `20260615200000_seed_meta_review_demo_dealership.sql` — slug **`demo`**, nome **`Demo`**, plano **enterprise**, tema **dark**, whitelabel completo + 6 veículos fictícios.

| Superfície | URL |
| --- | --- |
| Painel loja | `https://demo.loja.autopainel.com.br/login` |
| Vitrine | `https://demo.autopainel.com.br` |
| Integrações Meta | `https://demo.loja.autopainel.com.br/painel/integracoes` |
| Estoque (publicar) | `https://demo.loja.autopainel.com.br/painel/estoque` |

**Credenciais para o revisor Meta** (após `npm run seed:demo-users` no project remoto):

| Campo | Valor |
| --- | --- |
| E-mail | `gestor.demo@autopainel.demo` |
| Senha | `LojaDemo123!` |

**Roteiro sugerido no formulário App Review:** login → **Integrações** → **Conectar com Facebook** → autorizar Página + Instagram → abrir veículo em destaque (Corolla Cross ou Civic) → **Compartilhar nas redes** → confirmar preview do carrossel (dry-run enquanto `SOCIAL_PUBLISH_DRY_RUN=true`).

**Nota DNS:** Registro.br **não suporta wildcard** — cada slug precisa de 2 CNAME explícitos **ou** DNS na Cloudflare com `*.autopainel.com.br` / `*.loja.autopainel.com.br`. Vercel: `npm run dealership:hosts:provision -- demo`. Ver `DEALERSHIP_HOSTS_PROVISIONING.md`.

### 8.7 Simular Meta sem Facebook (modo gravação)

Use **`INTEGRATIONS_MOCK_MODE=true`** para demo/screencast interno **sem popup Facebook**, **sem Sharp/upload** e **sem worker real**:

| Variável | Onde | Efeito |
| --- | --- | --- |
| `INTEGRATIONS_MOCK_MODE` | `.env.local` + Supabase Edge | Ativa mock completo |
| `META_TOKENS_CRYPTO_SECRET` | Edge + painel (`SUPABASE_SERVICE_ROLE_KEY` no painel) | Credenciais fictícias na conexão mock |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel/local `dealership-panel` | Conexão mock 1-clique |

**Fluxo de gravação (recomendado):**

1. `/painel/integracoes` → banner amarelo «Modo gravação»
2. **Conectar com Facebook** → conecta instantaneamente (*Demo Motors — Oficial* · `@demo_motors_sp`)
3. `/painel/estoque` → veículo com foto → **Ver preview** → **Compartilhar agora**
4. Status **Publicado** imediato (simulado)

```bash
# .env.local
INTEGRATIONS_MOCK_MODE=true
SUPABASE_SERVICE_ROLE_KEY=<service role>
META_TOKENS_CRYPTO_SECRET=<secret>

npm run integration:secrets:configure
npm run supabase:deploy
npm run dev:dealership-panel
```

**Alternativa parcial:** `META_OAUTH_DEV_STUB=true` — popup simulado estilo Facebook, ainda depende do callback Edge.

**Limitações:** não válido para App Review Meta (exigem Facebook real). Desactivar antes de clientes reais.

---

## 9. Checklist de go-live (DevOps)

1. Criar app em [Meta for Developers](https://developers.facebook.com/) (tipo Business)
2. Redirect URI: `https://<project-ref>.supabase.co/functions/v1/meta-oauth-callback`
3. App Review — permissões: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`
4. URLs legais do marketing-site (HTTP 200) em Configurações → Básico
5. `.env.local`: `META_APP_*`, `META_TOKENS_CRYPTO_SECRET`, `META_PLATFORM_APP_ONLY=true`
6. `npm run meta:config:smoke` → sem erros
7. `npm run integration:secrets:configure` + Vercel `dealership-panel` (ver `INTEGRATIONS_DEPLOY.md`)
8. Migração `20260610160000` aplicada no remoto
9. `supabase functions deploy meta-oauth-callback social-publish-worker`
10. Smoke: `/painel/integracoes` → Conectar → escolher página → preview carrossel → job dry-run
11. Quando App Review aprovado: `SOCIAL_PUBLISH_DRY_RUN=false` na Edge + redeploy worker

---

## 10. Referências no repositório

- Edge callback: `supabase/functions/meta-oauth-callback/index.ts`
- OAuth start: `apps/dealership-panel/src/app/api/painel/integracoes/meta/oauth/start/route.ts`
- UI Connect: `social-meta-integration-card.tsx` (form legado `meta-developer-app-form.tsx` só sem `META_PLATFORM_APP_ONLY`)
- Fila: `social_publication_jobs` — migração `20260507140000_social_media_meta_oauth_scaffold.sql`
- Smoke config: `npm run meta:config:smoke`
- Decisão anterior (modelo B): `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` §3.2 — **supersedida em produção** por este doc a partir de 2026-06-10.
