# GTM + GA4 — passo a passo completo (AutoPainel)

Guia alinhado ao **setup real** da AutoPainel (junho/2026).

| Ferramenta | ID seu |
| --- | --- |
| **GTM** (container) | `GTM-MV99ZXW9` — conta Auto Painel / autopainel.com.br |
| **GA4** (ID de métricas) | `G-VR8MDJE9H1` — propriedade AutoPainel, fluxo Web autopainel.com.br |

**Status atual (pelos seus prints):** pageviews e eventos básicos **já chegam** ao GA4 via tag **Tag GA** no GTM. Falta cadastrar dimensões no GA4 e completar variáveis/tags no GTM para loja/app/eventos de produto.

**Referências:** [`GTM.md`](./GTM.md) · [`GTM_EVENTS.md`](./GTM_EVENTS.md).

---

## Onde você está vs onde precisa ir

| Você já fez ✅ | Ainda falta ⏳ |
| --- | --- |
| Fluxo Web GA4 + `G-VR8MDJE9H1` | 5 dimensões em **outro menu** do GA4 (não é em Fluxos de dados) |
| GTM tag **Tag GA** (Tag do Google) em Initialization | Variáveis do dataLayer `ap_*` no GTM |
| GA4 mostra páginas (Demo \| Painel, Vitrine, etc.) | Acionador `ap_custom_event` + tag de evento |
| | Parâmetros `ap_app_surface`, `ap_dealership_slug` enviados ao GA4 |

### Sua tag GTM está errada?

**Não** — para pageviews, está correta:

- Tipo: **Tag do Google** (nome antigo: Configuração GA4)
- ID: `G-VR8MDJE9H1`
- Acionador: **Initialization - All Pages**

Isso explica os acessos que você vê no GA4 desde ontem.

O que falta **não é trocar** essa tag — é **complementar** com variáveis + parâmetros + (opcional) segunda tag para eventos custom.

### Onde NÃO cadastrar dimensões

Você abriu: **Administrador → Coleta e modificação de dados → Fluxos de dados → AutoPainel**.

Nessa tela existem «Criar eventos personalizados» e «Modificar eventos» — **ignore para `ap_*`**. Dimensões personalizadas **não ficam aqui**.

---

### O que o código já faz por você

Os 4 apps Next.js **já enviam** para o GTM:

| Campo no dataLayer | Exemplo | Quando |
| --- | --- | --- |
| `ap_app_surface` | `marketing` | A cada página |
| `ap_page_hostname` | `guiotti.autopainel.com.br` | A cada página |
| `ap_dealership_slug` | `guiotti` | Vitrine/painel com slug |
| `ap_dealership_id` | UUID | Quando cookie existe |
| `event: ap_custom_event` | — | Ações (formulário, cliques, etc.) |
| `ap_event` | `lead_form_submit` | Nome do evento de produto |

Você **não precisa** alterar o site para ter pageviews nem o contexto por loja.

### O que NÃO fazer no GA4 (erro comum)

Na tela **Admin → Fluxos de dados → [seu fluxo] → Criar evento**, o GA4 oferece **«Criar sem código»** (baseado em URL ou em `page_view`).

**Não use isso** para criar eventos como `ap_app_surface`, `ap_dealership_slug` ou `lead_form_submit`.

| Abordagem | Resultado |
| --- | --- |
| ❌ GA4 «Criar sem código» com nome `ap_app_surface` | Não lê o dataLayer; exige URL fixa; não funciona para multitenant |
| ✅ GTM lê o dataLayer e envia ao GA4 | Correto — é o fluxo deste guia |

No GA4 você só:

1. Cria o **fluxo Web** e copia o ID `G-XXXXXXXXXX`
2. Registra **dimensões personalizadas** (para aparecer nos relatórios)
3. Marca **eventos principais** (conversões) **depois** que os eventos chegarem do GTM

Todo o resto é no **GTM** ([tagmanager.google.com](https://tagmanager.google.com)).

---

## Visão geral do fluxo

```
Site AutoPainel
    │  (snippet GTM + dataLayer no código)
    ▼
GTM Container GTM-MV99ZXW9
    │  Variáveis DL → Tags GA4 → Triggers
    ▼
Propriedade GA4 (ID G-XXXXXXXXXX)
    │  Relatórios, DebugView, conversões
    ▼
Você analisa por app, por loja, por evento
```

---

# Parte A — Google Analytics 4

## A.1 Criar ou abrir a propriedade

1. Acesse [analytics.google.com](https://analytics.google.com).
2. Canto inferior esquerdo: ícone **Admin** (engrenagem).
3. Coluna **Conta**: selecione a conta da AutoPainel (ou **Criar conta**).
4. Coluna **Propriedade**: **Criar propriedade** (se ainda não existir).
   - Nome: `AutoPainel — Produção`
   - Fuso: `(GMT-03:00) Brasília`
   - Moeda: `BRL`
5. Assistente de criação: escolha setor **Tecnologia** / **Software** (ou o mais próximo).
6. Objetivos de negócio: marque o que fizer sentido (ex.: gerar leads, examinar comportamento).

## A.2 Criar fluxo de dados Web

1. Ainda em **Admin**, coluna **Propriedade**.
2. **Coleta e modificação de dados** → **Fluxos de dados**.
3. **Adicionar fluxo** → **Web**.
4. Preencha:
   - **URL do site:** `https://autopainel.com.br`
   - **Nome do fluxo:** `AutoPainel — todos os apps`
5. Clique **Criar fluxo**.
6. Na página do fluxo, copie o **ID de métricas** no canto superior direito — formato **`G-XXXXXXXXXX`**.  
   Anote em um bloco de notas; usará no GTM.

> Um único fluxo Web basta: marketing, admin, painel e vitrines enviam pageviews pelo mesmo container GTM.

## A.3 Dimensões personalizadas — caminho exato no GA4 (português)

### Como chegar (passo a passo com o menu que você já usa)

1. [analytics.google.com](https://analytics.google.com) → propriedade **AutoPainel**.
2. Canto **inferior esquerdo**: ícone de **engrenagem** → **Administrador**.
3. Olhe a **coluna do meio** — título **Configurações da propriedade** (não é a coluna da conta à esquerda).
4. Role a coluna do meio **para baixo**, **passando** o bloco onde você estava:
   - ~~Coleta e modificação de dados~~
   - ~~Fluxos de dados~~
5. Encontre o bloco **Exibição de dados** (fica **abaixo** de «Coleta e modificação de dados»).
6. Clique em **Definições personalizadas**.
7. Aba superior: **Dimensões personalizadas**.
8. Botão azul **Criar dimensão personalizada**.

**Atalho:** na Página inicial do GA4, card **Acessos recentes** → **Administrador** → mesma coluna do meio → **Exibição de dados** → **Definições personalizadas**.

### Se não aparecer «Exibição de dados»

- Confirme que está na propriedade **AutoPainel** (seletor no topo), não só na conta.
- Precisa de permissão **Editor** ou **Administrador** na propriedade.
- Aumente o zoom do navegador ou role a coluna do meio — o bloco fica abaixo de «Coleta e modificação de dados».

### Criar as 5 dimensões (repita 5 vezes)

Em **Criar dimensão personalizada**, cada linha:

| Nome de exibição | Escopo | Nome do parâmetro do evento |
| --- | --- | --- |
| App surface | **Evento** | `ap_app_surface` |
| Dealership slug | **Evento** | `ap_dealership_slug` |
| AP event | **Evento** | `ap_event` |
| AP event category | **Evento** | `ap_event_category` |
| AP event label | **Evento** | `ap_event_label` |

**Importante:** em «Nome do parâmetro do evento», digite **exatamente** como na tabela (com underscores, minúsculas).

**Descrição** e **unidade de medida:** pode deixar em branco.

Clique **Salvar** em cada uma.

**Prazo:** relatórios Explorar podem levar **24–48 h**; **DebugView** e tempo real funcionam antes.

> **Não confundir:** «Criar eventos personalizados» dentro do **fluxo Web** ≠ dimensões personalizadas. São menus diferentes.

## A.4 Eventos principais (conversões) — faça DEPOIS do GTM

**Não** crie eventos manualmente aqui. Só marque conversão quando o evento **já existir** (vindo do GTM):

1. **Admin** → **Exibição de dados** → **Eventos**.
2. Aguarde aparecer na lista (ex.: `lead_form_submit`) — teste com GTM Preview + DebugView.
3. Ative o toggle **Marcar como evento principal** na linha do evento.

Eventos candidatos a conversão:

| Evento | Superfície | Significado |
| --- | --- | --- |
| `lead_form_submit` | marketing | Formulário `/contato` enviado |
| `lead_submit` | vitrine | Lead na loja (quando implementado) |

---

# Parte B — Google Tag Manager

## B.1 Abrir o container correto

1. [tagmanager.google.com](https://tagmanager.google.com).
2. Conta: **Auto Painel**.
3. Container: **autopainel.com.br** — ID **`GTM-MV99ZXW9`** (visível em Admin → Contêiner).
4. Aba **Espaço de trabalho** (Workspace) — é onde você cria variáveis, tags e acionadores.

Confirme na Vercel que `NEXT_PUBLIC_GTM_ID=GTM-MV99ZXW9` nos 4 projetos (Parte D).

## B.2 Criar variáveis da camada de dados (7 variáveis)

Menu lateral esquerdo: **Variáveis** → seção **Variáveis definidas pelo usuário** → **Nova**.

Para **cada linha** da tabela:

1. Clique **Nova**.
2. Ícone de engrenagem → escolha **Variável da camada de dados**.
3. **Nome da variável da camada de dados:** copie exatamente da coluna «Nome DL» (case-sensitive).
4. **Nome da variável** (rótulo no GTM): use a coluna «Nome no GTM».
5. **Salvar**.

| Nome no GTM | Nome DL (camada de dados) |
| --- | --- |
| DL — ap_app_surface | `ap_app_surface` |
| DL — ap_page_hostname | `ap_page_hostname` |
| DL — ap_dealership_slug | `ap_dealership_slug` |
| DL — ap_dealership_id | `ap_dealership_id` |
| DL — ap_event | `ap_event` |
| DL — ap_event_category | `ap_event_category` |
| DL — ap_event_label | `ap_event_label` |

**Versão da camada de dados:** deixe **Versão 2** (padrão).

## B.3 Complementar sua tag **Tag GA** (já publicada)

Você já tem a tag base. Agora envie o contexto AutoPainel em **todo** pageview.

1. GTM → **Tags** → abra **Tag GA**.
2. Seção **Configurações** (ou **Parâmetros de configuração** / **Config parameter table**).
3. **Adicionar parâmetro** (pode aparecer como linhas Nome/Valor):

| Nome do parâmetro | Valor |
| --- | --- |
| `ap_app_surface` | `{{DL — ap_app_surface}}` |
| `ap_page_hostname` | `{{DL — ap_page_hostname}}` |
| `ap_dealership_slug` | `{{DL — ap_dealership_slug}}` |

4. Acionador: mantenha **Initialization - All Pages**.
5. **Salvar** (ainda não publique — falta B.4 e B.5).

> Se a interface mostrar só «ID da tag» (`G-VR8MDJE9H1`) e não tiver tabela de parâmetros, pule para B.5 (tag de evento separada) — o essencial para eventos custom é o acionador `ap_custom_event`.

## B.4 Acionador — Evento personalizado `ap_custom_event`

1. Menu **Acionadores** → **Novo**.
2. **Configuração do acionador** → **Evento personalizado**.
3. **Nome do evento:** `ap_custom_event` (exatamente assim).
4. **Este acionador é disparado em:** Todos os eventos personalizados.
5. **Nome:** `AP — Custom Event`.
6. **Salvar**.

## B.5 Tag 2 — Evento GA4 (ações de produto)

1. **Tags** → **Nova**.
2. Tipo: **Evento do Google Analytics: GA4**.
3. **ID de métricas:** selecione **{{Configuração da tag}}** → escolha **Tag GA** (usa `G-VR8MDJE9H1`).
4. **Nome do evento:** clique o ícone de tijolo → selecione variável **`{{DL — ap_event}}`**.
5. Expanda **Parâmetros do evento** → **Adicionar linha** para cada parâmetro:

| Nome do parâmetro | Valor (variável GTM) |
| --- | --- |
| `ap_event_category` | `{{DL — ap_event_category}}` |
| `ap_event_label` | `{{DL — ap_event_label}}` |
| `ap_app_surface` | `{{DL — ap_app_surface}}` |
| `ap_dealership_slug` | `{{DL — ap_dealership_slug}}` |
| `ap_page_hostname` | `{{DL — ap_page_hostname}}` |

6. **Acionamento:** selecione `AP — Custom Event`.
7. **Nome da tag:** `GA4 — Event — AP Custom`.
8. **Salvar**.

## B.6 (Opcional) Enriquecer pageviews com contexto

Para que **todo** `page_view` leve `ap_app_surface` e `ap_dealership_slug` (não só eventos custom):

1. Abra a tag `GA4 — Config — All Pages` → **Parâmetros de evento** (ou Configurações de campos).
2. Adicione os mesmos parâmetros da tabela B.5.
3. Salve.

## B.7 Consentimento — site marketing

No marketing, o banner de cookies controla quando o GTM carrega scripts de analytics.

- Se o site só injeta GTM após «Aceitar» cookies de analytics → tags acima disparam só com consentimento.
- Se precisar **Consent Mode**: crie tag **Consent Initialization** antes das tags GA4 (avançado; alinhar com `/politica-de-cookies`).

Admin, painel e vitrine: sem banner obrigatório hoje (política interna).

## B.8 Modo Preview (testar antes de publicar)

1. GTM → botão **Visualizar** (canto superior direito).
2. Informe a URL: `https://autopainel.com.br` → **Connect**.
3. Abre o site com painel de debug do GTM.

**Checklist no Preview:**

| URL | O que verificar |
| --- | --- |
| `https://autopainel.com.br` | Tag `GA4 — Config` disparou; variável `ap_app_surface` = `marketing` |
| `https://autopainel.com.br/contato` | Enviar formulário → tag `GA4 — Event — AP Custom` dispara; `ap_event` = `lead_form_submit` |
| `https://guiotti.autopainel.com.br` | `ap_dealership_slug` = `guiotti`, `ap_app_surface` = `customer_storefront` |
| `https://admin.autopainel.com.br` | `ap_app_surface` = `admin` |

No painel Preview → aba **Camada de dados** (Data Layer): confirme os campos `ap_*` após cada navegação.

## B.9 Publicar

1. Botão **Enviar** (Submit) no topo.
2. **Nome da versão:** `GA4 inicial — AutoPainel`.
3. **Descrição:** `Config + eventos ap_custom_event`.
4. **Publicar**.

---

# Parte C — Validar no GA4

## C.1 DebugView (tempo real)

1. GA4 → **Admin** → **DebugView** (ou **Configurar** → **DebugView**).
2. Com GTM Preview ativo, navegue no site.
3. Deve aparecer:
   - `page_view` com parâmetros `ap_app_surface`, etc.
   - `lead_form_submit` ao testar `/contato`.

## C.2 Relatório de eventos (após algumas horas)

1. **Relatórios** → **Engajamento** → **Eventos**.
2. Procure `page_view`, `lead_form_submit`.

## C.3 Explorar por loja (após dimensões registradas)

1. **Explorar** → **Exploração em branco**.
2. **Dimensões:** importe `Dealership slug`, `App surface`.
3. **Métricas:** `Contagem de eventos`.
4. Filtro: `App surface` = `customer_storefront`.
5. Quebra por `Dealership slug` → vê cada loja.

---

# Parte D — Vercel e ambiente local

## D.1 Variável nos 4 projetos

Para cada projeto Vercel (`marketing-site`, `admin-master`, `dealership-panel`, `customer-site`):

1. **Settings** → **Environment Variables**.
2. Nome: `NEXT_PUBLIC_GTM_ID`  
   Valor: `GTM-MV99ZXW9`  
   Ambientes: **Production** (e **Preview** se quiser testar em preview URLs).
3. **Save**.

## D.2 Redeploy obrigatório

1. **Deployments** → último deployment → menu **⋯** → **Redeploy**.
2. Repita para os 4 projetos se alterou a variável.

## D.3 Local

Na raiz do monorepo, `.env.local`:

```
NEXT_PUBLIC_GTM_ID=GTM-MV99ZXW9
```

Depois:

```bash
npm run sync:env
npm run dev:marketing-site   # ou dev:all
```

Aceite cookies de analytics no banner para o GTM carregar no marketing local.

---

# Parte E — Catálogo de eventos (o que pode aparecer no GA4)

Implementados hoje:

| ap_event | Onde | Como testar |
| --- | --- | --- |
| `lead_form_submit` | marketing `/contato` | Enviar formulário com sucesso |

Backlog (código ainda não envia — não espere no GA4 até implementar):

| ap_event | Superfície |
| --- | --- |
| `cookie_consent_accept` | marketing |
| `whatsapp_click` | marketing |
| `vehicle_detail_view` | vitrine |
| `lead_submit` | vitrine |
| `vehicle_publish_social` | painel |
| `integration_connect` | painel |

Detalhe técnico: [`GTM_EVENTS.md`](./GTM_EVENTS.md).

---

# Checklist final (copiar e colar)

```
GA4 (G-VR8MDJE9H1) — você já tem fluxo Web ✅
[ ] Administrador → Exibição de dados → Definições personalizadas → 5 dimensões
[ ] (Depois) Eventos → marcar lead_form_submit como evento principal

GTM (GTM-MV99ZXW9) — você já tem Tag GA ✅
[ ] 7 variáveis Data Layer (ap_*)
[ ] (Opcional) Parâmetros na Tag GA
[ ] Acionador AP — Custom Event
[ ] Tag GA4 — Event — AP Custom
[ ] Preview + Publicar versão 3
```

---

# Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| Tentei criar `ap_app_surface` no GA4 sem código e deu erro de URL | Caminho errado | Use GTM (este guia); não use «Criar sem código» para parâmetros `ap_*` |
| Nada no GA4 | GTM ID vazio ou deploy antigo | Vercel env + redeploy |
| Preview GTM vazio | Extensão bloqueada ou URL errada | Teste em aba anônima; URL com https |
| Sem `ap_dealership_slug` | Host sem slug | Use `{slug}.autopainel.com.br`, não `localhost:3003` puro |
| Evento custom não dispara | Trigger ou nome errado | Trigger deve ser exatamente `ap_custom_event` |
| Dimensões vazias em Explorar | Dimensões não registradas ou < 48h | Admin → Definições personalizadas |
| Marketing sem dados | Cookies não aceitos | Aceitar analytics no banner |
| `lead_form_submit` não aparece | Formulário com erro ou GTM bloqueado | Enviar form válido; conferir Preview |

---

# Resumo em uma frase

**GA4** recebe dados; **GTM** (`GTM-MV99ZXW9`) traduz o dataLayer do site em hits GA4; você **não** recria eventos `ap_*` manualmente no GA4 — só registra dimensões, publica o container e marca conversões quando os eventos chegarem.
