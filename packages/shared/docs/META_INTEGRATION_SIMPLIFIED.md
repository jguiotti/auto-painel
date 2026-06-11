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
| **2-M1** | Config: `resolveMetaAppRuntimeConfig` prioriza env plataforma; feature flag `META_PLATFORM_APP_ONLY=true` | Nenhuma |
| **2-M2** | UI: substituir `MetaDeveloperAppForm` por card **Conectar** + estados (wizard 3 passos) | 2-M1 |
| **2-M3** | Callback: pós-OAuth, resolver `page_id` + `ig_user_id`; UI seletor se múltiplas páginas | 2-M2 |
| **2-M4** | Worker `social-publish-worker` — MVP **imagem única** + legenda (sem carrossel Sharp) | Tokens OK |
| **2-M5** | Render carrossel 1080×1080 (Sharp em Route Handler Next ou serviço dedicado) + templates classic/performance/tech | 2-M4 |
| **2-M6** | Checkbox «Divulgar ao salvar» no formulário de veículo | 2-M4 |

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

## 8. Referências no repositório

- Edge callback: `supabase/functions/meta-oauth-callback/index.ts`
- OAuth start: `apps/dealership-panel/src/app/api/painel/integracoes/meta/oauth/start/route.ts`
- UI actual: `apps/dealership-panel/src/components/integrations/meta-developer-app-form.tsx` (a substituir)
- Fila: `social_publication_jobs` — migração `20260507140000_social_media_meta_oauth_scaffold.sql`
- Decisão anterior (modelo B): `TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` §3.2 — **supersedida em produção** por este doc a partir de 2026-06-10.
