# Regras de negócio (uso interno)

Esta página é **somente para a equipe AutoPainel**. Clientes das concessionárias **não** veem este conteúdo.

## Como manter atualizado

1. Para cada nova funcionalidade, o **PM** registra aqui o PRD em formato vivo: problema, escopo, regras de negócio numeradas e cenários de aceite.
2. Prefira **salvar pelo painel Admin** (botão «Salvar alterações»). O conteúdo fica na base Supabase com acesso restrito a operadores da plataforma (`super_admin`).
3. Este arquivo serve de **fallback** quando a migração `platform_internal_documents` ainda não foi aplicada no ambiente.

---

## Histórico vivo — PRDs registrados

### Índice de funcionalidades (controle PM)

| Módulo | Chave | Status | Documento |
| --- | --- | --- | --- |
| Simulador de financiamento | `finance_simulator` | Passos A-D concluídos (com hotfixes de banco aplicados) | Esta página + `documentacao-tecnica.md` |
| Gerador de QR Code para veículos | `qr_generator` | **Passo C implementado no repositório** (pendente QA funcional final de escaneamento/print cross-browser) | Esta página + `documentacao-tecnica.md` |
| Métricas avançadas da concessionária | `advanced_metrics` | **Passo C implementado no repositório** (pendente aplicar migração no Supabase + QA funcional final) | Esta página + `documentacao-tecnica.md` |
| Integração com classificados (OLX & WebMotors) | `classifieds_sync` | **Passo C inicial implementado e aplicado no ambiente** (migração + edge callback); pendente homologação com credenciais reais dos portais | Esta página + `documentacao-tecnica.md` |
| Kit de redes sociais com postagem automática (Meta) | `social_media_kit` | **Passo C inicial (OAuth + schema + UI Conexões) no repo**; pendentes render Sharp + worker Meta + UX finalização veículo | Esta página + `documentacao-tecnica.md` |
| Central de gestão (Admin Master) | `dealership_management_hub` | **Passo A–B documentados**; scaffold parcial no repositório (BD + papel `manager` + bloqueio painel inativo); UI por abas e exportações — roadmap | Esta página + `documentacao-tecnica.md` |
| Subdomínios por loja + OAuth por concessionária (OLX / WebMotors / Meta) | `classifieds_sync`, `social_media_kit`, resolução de host | **PRD/BZ** em `packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md` §7 + **BZ-TERR-***; jornada operador — alinhar com **`tenant_operator_journey`** | Esta página + doc partilhado |
| Acesso multi-tenant (Admin + painel + vitrine) | `tenant_operator_journey` | **PRD aprovado** (2026-05-08); handoff UX **Fase 2** registrado abaixo; refinamento técnico / QA multi-tenant após **aprovação UX** | Esta página |
| Templates dinâmicos da vitrine | `layout_id` | Implementado e registrado | Esta página + `documentacao-tecnica.md` |

---

### 2026-05-08 — Iniciativa: subdomínios por loja + credenciais OAuth por concessionária (síntese PM)

| Campo | Valor |
| --- | --- |
| **Nome** | Resolução multi-tenant por host (`*.domínio` / `custom_domain`) + armazenamento dinâmico de apps OAuth (classificados e, opcionalmente, Meta) por `dealership_id` |
| **Status** | PRD/BZ rascunho e revisão por função em **`packages/shared/docs/TENANT_SUBDOMAINS_AND_DEALER_OAUTH.md`** (§7); código de resolver `*.localhost` já alinhado no repo |
| **Objetivo** | Nenhuma integração OLX/WebMotors/Meta depende de um único par client_id/secret da AutoPainel; cada concessionária pode usar credenciais do **seu** programa nos portais; acesso à loja por subdomínio ou domínio próprio. |

**Regras resumidas:** ver tabela BZ-T1…BZ-T5 no doc partilhado. **Decisão PM (2026-05-08):** integração Meta **por concessionária** — aplicação em `developers.facebook.com` pertence ao **cliente**; credenciais (`dealership_meta_oauth_apps`) e fluxo OAuth iniciados no **painel da loja**. A AutoPainel **não** assume uma app Meta global como identidade de aplicativo em produção; `META_APP_*` no `.env` serve só de **fallback para desenvolvimento**. Qualquer chamada futura à Graph API (ex. carrossel) usa **tokens e app** dessa loja, não credenciais “da plataforma” para todos os tenants.

**Apps afectados:** `dealership-panel`, `customer-site`, Edge Functions Supabase, opcionalmente `admin-master` (visibilidade de slug/colisões).

**Contrato armazenamento:** migração no repositório `supabase/migrations/20260508220000_dealership_classifieds_oauth_apps.sql` — aplicar no Supabase antes de ligar Edge/UI a credenciais por loja; tipos em `packages/shared/src/types/classifieds-oauth-app.ts`.

#### Resolução de host falhou — página `/erro/concessionaria` (BZ de produto)

| ID | Regra |
| --- | --- |
| **BZ-TERR-001** | Se o sistema não conseguir determinar a concessionária pelo hostname (subdomínio da plataforma ou custom domain configurado), o utilizador **não** deve ver uma página genérica de erro HTTP sem contexto; deve ver uma mensagem em **português** a explicar que **não há loja associada a este domínio** (falha de tenant), sem numerar o erro como «404 HTTP» de forma a induzir em erro. |
| **BZ-TERR-002** | **Vitrine (`customer-site`):** só lojas com `dealerships.status = 'active'` podem ser resolvidas para o site público; loja existente mas inativa deve comportar-se como «sem vitrine» para esse host (redireccionamento para `/erro/concessionaria` quando o RPC público não devolve id). |
| **BZ-TERR-003** | **Painel (`dealership-panel`):** o middleware usa sempre o resolver **dashboard** (`resolve_dealership_id_by_host_for_dashboard`) nas rotas que exigem tenant — **não** o resolver «vitrine» (`resolve_dealership_id_by_host`) na raiz `/` nem nas páginas públicas da mesma app; assim evita-se erro de tenant quando a loja existe mas o fluxo anterior só aplicava dashboard em `/painel` e `/login`. Sem `dealership_id` resolvido, o acesso não prossegue até haver correspondência slug/host na base. |
| **BZ-TERR-004** | **Ambiente local:** o domínio raiz da plataforma (`NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`) deve estar sincronizado para as apps (`npm run sync:env`). Para hosts **`{slug}.localhost`**, o código força raiz efectiva **`localhost`** nas RPCs de resolução de host **mesmo** quando o env já define o domínio de produção — caso contrário o sufixo `.localhost` não casa com `.autopainel.com.br` e **todas** as lojas falham em dev. **Complemento:** em `development`, fallback explícito `*.localhost` ⇒ `localhost` quando a variável não chega ao middleware Edge (`resolveEffectivePlatformRootDomain`). |
| **BZ-TERR-005** | O **slug** da concessionária deve corresponder ao primeiro segmento do host da plataforma (ex.: `{slug}` para `{slug}.localhost` ou `{slug}.autopainel.com.br`); o motor de resolução na base passou a comparar slug de forma **case-insensitive** após a migração `20260508240000_resolve_dealership_host_slug_ci.sql`. |
| **BZ-TERR-006** | **Sem enumeração pública de tenants:** não existe página aberta na Internet para introduzir slug de loja; operadores obtêm URLs no Admin Master (cartão «Abrir vitrine e painel desta concessionária»). O bootstrap opcional `GET /painel/acesso/:slug` só com `NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true` (desenvolvimento). |

**Cenários de aceite (resumo):** **CA-TERR-001** — Aceder a `{slug}.localhost` sem registo com esse slug ⇒ página de erro de tenant, não cópia de «página não encontrada» do servidor. **CA-TERR-002** — Vitrine com loja `suspended` ⇒ não listagem pública nesse host; utilizador direccionado ao fluxo de erro de tenant. **CA-TERR-003** — Em `development`, a página de erro pode exibir checklist operacional (variáveis, `sync:env`, estado `active` na vitrine).

### Bloqueio squad — PRD completo (PM) + UX antes de desenvolvimento e QA (2026-05-13)

**Decisão de processo (equipa):** Para a funcionalidade **«acesso às concessionárias por slug/host + atalhos no Admin Master + experiência pública do painel da loja e da vitrine»**, **não** se inicia **refinamento técnico de implementação**, **código novo de produto** nem **QA formal de aceite** até existirem **dois entregáveis fechados**, nesta ordem:

1. **PM — PRD completo** (fonte de verdade: este ficheiro + `platform_internal_documents` quando em uso). O PRD deve cobrir **toda** a funcionalidade de ponta a ponta, não apenas hotfixes já feitos no repositório.
2. **UX / Design — ajustes de layout e de linguagem** para utilizadores **não técnicos** (hierarquia de ecrãs, estados vazio/erro/sucesso, tom de voz, acessibilidade básica). O output do UX deve ser **repassável aos desenvolvedores** (wireframes ou lista estruturada de alterações por ecrã / critérios visuais).

**Só após (1) e (2)** entram as fases **Arquitectura + Backend (refinamento técnico)** → **Frontend** → **QA**, conforme `rules/squad-agent-workflow.mdc`.

#### Checklist que o PM deve fechar no PRD (mínimo)

| # | Tópico | O PM deve deixar explícito |
| --- | --- | --- |
| P1 | **Problema e personas** | Operador `super_admin` / equipa AutoPainel vs. utilizador da concessionária (owner/manager/seller) vs. visitante da vitrine. |
| P2 | **Superfícies e rotas** | `admin-master` (edição de concessionária), `dealership-panel` (login, erro de tenant, painel após auth), `customer-site` (home e erro). Português em URLs e copy de UI. |
| P3 | **Regras de acesso** | Resolução por `Host` + slug; `custom_domain`; diferença painel (resolver dashboard) vs. vitrine (só `active`); dev `*.localhost` vs. produção `{slug}.autopainel.com.br` (ou domínio acordado). |
| P4 | **Segurança e privacidade** | Sem enumeração pública de slugs; sem jargão técnico em ecrãs finais sem decisão UX; opt-ins dev (`NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP`, etc.) quando aplicável. |
| P5 | **Critérios de aceite (CA)** | Lista testável (Given/When/Then ou equivalente) para: abrir painel e vitrine por loja **activa**; loja inactiva na vitrine; erro amigável; atalhos no Admin em dev e em prod. |
| P6 | **Fora de escopo / riscos** | O que não entra nesta entrega; dependências DNS/TLS/Supabase Auth redirect URLs. |

#### Checklist que o UX deve entregar após o PRD (mínimo)

| # | Entregável | Descrição |
| --- | --- | --- |
| U1 | **Jornada operador** | Onde e como o operador abre vitrine e painel de **qualquer** concessionária `active` sem confusão (um núcleo de acções, labels, ordem visual). |
| U2 | **Jornada utilizador da loja** | Login, recuperação de senha, erros — linguagem simples; se checklist técnico existir em dev, **oculto por defeito** ou atrás de «Detalhes para equipa técnica» (se o PM aceitar). |
| U3 | **Consistência** | Alinhamento com shells existentes e `@autopainel/shared/ui` (referência no PRD ou link para Figma/guia). |
| U4 | **Handoff para devs** | Lista por ecrã: componente/região, mudança pedida, critério de «feito». |

#### Estado actual do código (não substitui PRD)

Correcções técnicas já integradas no repositório (ex.: raiz efectiva `localhost` para `{slug}.localhost` com env de produção; cartão único de atalhos no Admin em dev) servem de **baseline** até o PRD e o UX **revalidarem** ou **alterarem** o comportamento. Qualquer mudança adicional de produto após o PRD deve seguir o mesmo bloqueio.

#### Próximo passo operacional

**PM:** fechar o PRD completo (tabela acima) e comunicar versão final à equipa (incluindo cópia para `platform_internal_documents` se aplicável).  
**UX:** iniciar **após** fecho do PRD; **Devs / QA:** iniciar **após** handoff UX aprovado pela equipa (ou pelo PM, conforme governação interna).

#### Instrução imediata ao PM

**PM:** o PRD **`tenant_operator_journey`** está **Aprovado** (2026-05-08) com **questões em aberto encerradas** na seção **13.1** e **handoff UX (Fase 2)** na **13.2**. Falta **confirmar o handoff UX** para liberar **Fase 3 (Arquiteto + Backend)**. Publique no Admin (**Documentação interna → Regras de negócio**) se usarem `platform_internal_documents` e atribua **Dono PM**.

**PM humano:** valide **Dono PM**, datas e copie o trecho relevante para o Admin quando aplicável. Texto deste arquivo em **pt-BR** (`rules/naming-and-language.mdc`).

#### Modelo de e-mail ao PM (copiar / colar)

**Assunto:** PRD `tenant_operator_journey` — aprovado; confirmação do handoff UX (Fase 2)

---

PM,

O **PRD** da iniciativa **multi-tenant + atalhos no Admin + painel + vitrine** está **Aprovado** no repositório (2026-05-08), com **13.1** (decisões PM) e **13.2** (handoff UX). Precisamos da **confirmação explícita do UX** para liberar **Fase 3 (Arquiteto + Backend)**.

1. Abra `apps/admin-master/content/internal-docs/regras-de-negocio.md` e localize a seção **«PRD — `tenant_operator_journey` … — Aprovado»** (abaixo, depois de «Modelo de e-mail ao PM»).
2. **Revise** as seções **1–13** e **13.1–13.2**; confirme **BZ-*** e **CA-***; preencha **Dono PM**; mantenha **Estado do PRD** = **Aprovado** até eventual mudança de escopo.
3. **Publique** no Admin (**Documentação interna → Regras de negócio** → *Salvar alterações*) se o projeto usar `platform_internal_documents`.
4. **Avise a equipe** (Slack ou e-mail) com o link do commit quando o **handoff UX (13.2)** estiver **confirmado** para avançar a Fase 3.

Enquanto o **handoff UX** não estiver **confirmado**, **Fase 3** e **implementação nova** permanecem sujeitas ao bloqueio em `rules/squad-agent-workflow.mdc` (PRD + UX antes de refinamento técnico / dev / QA de aceite).

Obrigado,  
Janaina

---

### PRD — `tenant_operator_journey` (multi-tenant: Admin + painel + vitrine) — **Aprovado**

> **Nota:** PRD **aprovado** em **2026-05-08** para avanço de **UX** (Fase 2 da squad). O **PM humano** deve preencher **Dono PM**, espelhar no Admin (**Documentação interna → Regras de negócio**) se usarem `platform_internal_documents`, e registrar mudanças de escopo. Texto em **português do Brasil (pt-BR)**.

| Campo | Valor |
| --- | --- |
| **Chave / ID da iniciativa** | `tenant_operator_journey` |
| **Última atualização** | **2026-05-08** |
| **Estado do PRD** | **Aprovado** |
| **Dono PM** | **A atribuir pela equipe** |
| **Stakeholders** | Engenharia (Engineering), Experiência do usuário (UX), Operações AutoPainel (Operations AutoPainel) |

#### 1. Resumo executivo (5–10 linhas)

Esta iniciativa define a **jornada multi-tenant** de ponta a ponta: um operador da AutoPainel abre, a partir do Admin Master, os links corretos da **vitrine** e do **painel** de cada concessionária; um colaborador da loja acessa o painel pelo **host** correto (subdomínio da plataforma ou domínio próprio configurado); um visitante navega na **vitrine** apenas quando a loja está **ativa** e o host resolve para essa loja. Quando o host não corresponde a nenhuma loja, ou a vitrine não está disponível por estado da loja, o usuário vê **páginas de erro em português**, com linguagem **simples**, sem expor detalhes técnicos nem permitir **descobrir slugs** por tentativa pública. Em desenvolvimento local, as URLs por slug (`*.localhost` em portas distintas) devem comportar-se de forma **previsível** graças à raiz efetiva da plataforma alinhada com o código e à sincronização de variáveis de ambiente. O objetivo imediato é **fechar o produto** desta fatia (regras, superfícies, segurança e critérios de aceite) para o **UX** produzir o handoff de layout e copy, e só então avançar refinamento técnico adicional, desenvolvimento e QA formal, conforme governação da equipe.

#### 2. Problema e contexto

| Pergunta | Resposta (PM) |
| --- | --- |
| Que dor resolvemos? | Operadores e usuários finais perdem tempo e confiança quando o **mesmo slug** funciona num ambiente e falha noutro, quando aparecem **mensagens técnicas** ou genéricas que não explicam que «não há loja neste endereço», ou quando se misturam regras da **vitrine** (só loja ativa) com as do **painel** (resolver de contexto «dashboard»). |
| O que acontece hoje sem esta entrega? | Risco de **interpretações divergentes** entre equipes (o que mostrar em erro, quem pode ver que URL, se existe atalho público por slug), atraso no **handoff UX** e retrabalho em telas de login, recuperação de senha e vitrine. |
| Que decisões de produto já estão tomadas (e não podem ser alteradas pelo dev)? | **Sem enumeração pública de tenants**; **vitrine só para `dealerships.status = 'active'`**; **painel** com resolução de tenant via fluxo **dashboard** nas áreas que o exigem; **slug comparado de forma insensível a maiúsculas/minúsculas** no motor de host; em **desenvolvimento**, suporte explícito a `{slug}.localhost` com raiz efetiva coerente; **mensagens de erro e login orientadas ao usuário não técnico** em produção; **atalhos oficiais** ao painel e à vitrine **a partir do Admin Master** para operadores. Alterações a estes pilares exigem **revisão de PM** (e impacto em UX/Engenharia). |

#### 3. Objectivos e métricas de sucesso

| Objectivo | Métrica ou sinal verde (PM) |
| --- | --- |
| Operador abre vitrine e painel da mesma loja **ativa** (`active`) sem pedir URL por canal informal | Em sessão de validação interna, **100%** dos participantes Operations encontram os dois links na tela da concessionária no Admin sem instrução escrita adicional (amostra definida pelo PM na fase de QA). |
| Usuário da loja e visitante da vitrine **não** veem jargão de infraestrutura, códigos de erro HTTP como substituto de explicação, nem pistas que permitam adivinhar outras lojas | Revisão de copy: **zero** ocorrências de termos como «RPC», «middleware», «404» como título principal em telas finais em **produção**; lista de strings aprovada pelo UX após este PRD. |
| Resolução de host **coerente** entre vitrine e painel conforme regra de contexto | Casos de teste CA-TOJ cobrem **painel** e **vitrine** com os mesmos slugs em dev e prod; falhas regressivas = bloqueio de release. |
| Redução de tickets internos «o link não abre a minha loja» | Operações registra contagem **antes/depois** (baseline a definir na primeira semana após deploy); meta quantitativa a fixar com Operations após duas semanas de uso. |

#### 4. Personas e permissões

| Persona | O que precisa de fazer | Restrições / papéis |
| --- | --- | --- |
| Operador AutoPainel (`super_admin`) | Editar concessionária, confirmar slug e domínios, **copiar ou abrir** links oficiais da vitrine e do painel para suporte e onboarding; quando necessário, entrar no `dealership-panel` de qualquer loja para operação assistida | Apenas usuários autenticados com papel `super_admin`; no `dealership-panel`, a operação segue o tenant resolvido pelo host actual (sem enumeração pública de slugs) |

- O `dealership-panel` deve manter layout operacional com **fundo claro fixo**; customizações de tema (claro/escuro, cores e fontes) continuam restritas à vitrine (`customer-site`).
- Logo e favicon cadastrados da concessionária devem ser reaproveitados em ambas as superfícies (`customer-site` e `dealership-panel`), com fallback apenas quando o ativo estiver ausente.
| Usuário da concessionária (owner / manager / seller) | Iniciar sessão, recuperar senha, concluir definição de senha quando aplicável, trabalhar no painel após autenticação | Acesso ao painel condicionado a **tenant resolvido** pelo host e a políticas de conta/estado da loja já definidas na plataforma (ex.: conta inativa continua a ser tratada nas regras da central de gestão, sem contradizer este PRD) |
| Visitante da vitrine | Consultar stock e páginas públicas da loja **ativa** (`active`) | Sem autenticação; sem acesso a dados internos; se o host não mapeia loja ativa, apenas fluxo público de **erro de concessionária** |

#### 5. Âmbito funcional (superfícies)

Marque **In** / **Out** / **Mais tarde** por linha.

| Superfície | In / Out / Mais tarde | Notas (PM) |
| --- | --- | --- |
| `admin-master` — edição de concessionária (atalhos vitrine + painel) | **In** | Cartão ou região única com ações «Abrir vitrine» e «Abrir painel» (rótulos finais sujeitos a handoff UX); URLs geradas com host de **produção** ou **dev** conforme ambiente |
| `dealership-panel` — resolução de tenant, login, erro, pós-login | **In** | Inclui rotas de autenticação em português, página de erro de concessionária e fluxo após `dealership_id` resolvido |
| `customer-site` — resolução de tenant, home, erro | **In** | Home pública apenas quando a loja resolve e está **ativa**; caso contrário redirecionamento para `/erro/concessionaria` |
| Documentação interna / operador | **In** | `regras-de-negocio.md`, `documentacao-tecnica.md` e espelho em base quando em uso; deve mencionar variáveis, portas locais e política de enumeração |
| `marketing-site` | **Out** | Não faz parte desta iniciativa; páginas de marketing não servem como atalho operacional nem como descoberta de slug |
| Aplicações móveis nativas | **Mais tarde** | Qualquer app nativa futura deverá reutilizar as mesmas regras de host; fora do âmbito de entrega atual |

#### 6. Regras de negócio (BZ) — numerar todas

| ID | Regra (testável, sem ambiguidade) |
| --- | --- |
| **BZ-TOJ-001** | **Consolida a intenção de BZ-TERR-001:** Se o sistema não determinar a concessionária pelo hostname (subdomínio da plataforma ou domínio personalizado válido), o usuário deve ver uma página em **português** a explicar que **não existe loja associada a este endereço**, sem usar uma página em branco nem uma mensagem que sugira «erro genérico do servidor» ou «código 404» como substituto da explicação. |
| **BZ-TOJ-002** | **Consolida a intenção de BZ-TERR-002:** Na vitrine (`customer-site`), apenas concessionárias com `dealerships.status = 'active'` podem ser resolvidas para conteúdo público; se a loja existir mas **não** estiver ativa, o comportamento é o de **ausência de vitrine** nesse host (redirecionamento para `/erro/concessionaria` quando o fluxo público não obtém identificador válido). |
| **BZ-TOJ-003** | **Consolida a intenção de BZ-TERR-003:** No painel (`dealership-panel`), nas rotas que exigem tenant, a resolução deve seguir o contrato **dashboard** (resolver adequado ao contexto de painel, p.ex. `resolve_dealership_id_by_host_for_dashboard`), **nunca** reutilizando o resolver de **vitrine** na raiz ou em páginas públicas da mesma aplicação de forma a bloquear incorretamente lojas existentes; sem `dealership_id` resolvido, o usuário **não** avança para área autenticada do painel. |
| **BZ-TOJ-004** | **Consolida a intenção de BZ-TERR-004:** Em ambiente local, a variável `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` deve estar **sincronizada** entre apps (`npm run sync:env`). Para hosts `{slug}.localhost`, a plataforma deve usar raiz efetiva **`localhost`** na cadeia de resolução de host **mesmo** que o arquivo de ambiente contenha o domínio de produção, de modo que o sufixo `.localhost` case com as regras esperadas; em `development`, mantém-se o fallback explícito `*.localhost` ⇒ `localhost` quando a variável não chega ao middleware de borda. |
| **BZ-TOJ-005** | **Consolida a intenção de BZ-TERR-005:** O primeiro segmento do hostname da plataforma corresponde ao **slug** da concessionária (ex.: `minhaloja` em `minhaloja.localhost` ou `minhaloja.autopainel.com.br`); a comparação do slug na base é **insensível a maiúsculas e minúsculas** (comportamento alinhado à migração `20260508240000_resolve_dealership_host_slug_ci.sql`). |
| **BZ-TOJ-006** | **Consolida a intenção de BZ-TERR-006:** **É proibida** a existência de qualquer página **pública** na Internet cujo propósito seja introduzir ou adivinhar slug de loja (enumeração ou «dicionário» de tenants). Os operadores obtêm URLs de vitrine e painel **apenas** no Admin Master (ex.: cartão «Abrir vitrine e painel desta concessionária» ou equivalente aprovado pelo UX). O caminho opcional `GET /painel/acesso/:slug` existe **somente** em desenvolvimento e **somente** com `NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true`. |
| **BZ-TOJ-007** | Os links gerados no Admin Master para uma concessionária **ativa** devem abrir, em cada ambiente, o **painel** na porta e aplicação corretas e a **vitrine** na aplicação e porta corretas, sem exigir que o operador edite manualmente o host além do previsto na documentação interna. |
| **BZ-TOJ-008** | Domínio personalizado (`custom_domain`), quando configurado e válido, participa da mesma matriz de decisão: se não resolver a uma loja no contexto adequado (vitrine vs painel), aplicam-se as mesmas regras de **erro amigável** e **sem fuga de informação** sobre a existência de outras lojas. |
| **BZ-TOJ-009** | Todos os **segmentos de URL visíveis no browser** para estas jornadas mantêm-se em **português** (kebab-case quando multi-palavra), alinhados à convenção da plataforma; identificadores técnicos de repositório (nomes de apps) permanecem em inglês apenas em documentação técnica. |
| **BZ-TOJ-010** | Telas de **início de sessão**, **recuperação de senha** e **definição de senha** no painel usam o mesmo princípio de **clareza** e **ausência de jargão** que a página de erro de concessionária; mensagens de falha descrevem a ação possível em linguagem humana (ex.: «verifique o endereço»), não mensagens de depuração. |
| **BZ-TOJ-011** | Qualquer **pista técnica** para equipes (checklist de variáveis, lembretes de `sync:env`, etc.) na página de erro ou análoga é **permitida apenas** em ambiente de **desenvolvimento** e **apenas** atrás de um padrão de UX aprovado pelo PM no handoff (ex.: seção recolhível «Detalhes para a equipe técnica»); em **produção**, esses elementos **não** aparecem por padrão. |
| **BZ-TOJ-012** | Após cada alteração de comportamento desta iniciativa, a **documentação interna** (regras de negócio e técnica) deve ser atualizada na **mesma entrega**, incluindo exemplos de URL, variáveis de ambiente e referência cruzada às regras **BZ-TERR-*** que permanecem como registro histórico no documento, sem duplicar conflitos com **BZ-TOJ-***. |

#### 7. Fluxos principais (descrever por passos)

**7.1 Operador — abrir vitrine e painel de uma concessionária `active`**

1. O operador inicia sessão no **admin-master** e navega até a ficha de edição da concessionária em estado **ativo** (`active`).
2. Na região de atalhos (nome final por UX), escolhe **Abrir painel**; o browser abre o URL do painel com o host correto para o ambiente (dev ou produção).
3. Na mesma região, escolhe **Abrir vitrine**; o browser abre o URL público da vitrine com o mesmo tenant implícito pelo host.
4. Se algum link não abrir a loja esperada, o operador segue o guia interno (DNS, estado da loja, variáveis) e registra o incidente em Operations; **não** se divulga slug por canais não oficiais para contornar o fluxo.

**7.2 Usuário da loja — primeiro acesso e login**

1. O colaborador recebe o URL do painel (operacionalmente gerado a partir do Admin ou comunicação segura da loja).
2. O browser carrega o host `{slug}.domínio` ou equivalente em desenvolvimento; o middleware resolve o tenant no contexto **painel**.
3. O usuário vê a tela de **início de sessão** em português, introduz credenciais e entra nas áreas permitidas pelo seu papel.
4. Se usar **recuperar senha** ou **definir senha**, percorre os passos com mensagens simples; em caso de host incorreto, vê primeiro o erro de concessionária antes de qualquer área autenticada.

**7.3 Erro — domínio ou loja não reconhecida**

1. O usuário acessa um host que não mapeia para uma concessionária no contexto pedido **ou** a vitrine não está disponível por estado da loja.
2. A aplicação redireciona ou mostra a página `/erro/concessionaria` com título e texto em **português claro**.
3. O texto explica que **não há loja neste endereço** ou equivalente aprovado pelo UX, com **próximo passo** humano (contactar quem geriu o site, verificar endereço).
4. Em **produção**, não são exibidos por padrão blocos técnicos; em **desenvolvimento**, o bloco técnico só aparece conforme **BZ-TOJ-011**.

#### 8. Ambientes (dev vs produção)

| Ambiente | Host esperado (exemplo) | Quem configura | Notas |
| --- | --- | --- | --- |
| Desenvolvimento local | Painel: `http://{slug}.localhost:3002` — Vitrine: `http://{slug}.localhost:3003` | Engenharia (com apoio de Operations para documentar o «como correr») | Portas alinhadas ao monorepo; `{slug}` é o slug da concessionária; requer resolução local conforme guia técnico; raiz efetiva `localhost` conforme **BZ-TOJ-004** |
| Produção | `https://{slug}.{domínio_plataforma}` — exemplo: `https://{slug}.autopainel.com.br` | Operações AutoPainel em coordenação com Engenharia (DNS, certificados) | Domínio final da plataforma é a «fonte de verdade» operacional; **wildcard** ou equivalente deve cobrir `{slug}`; **TLS** obrigatório em `https` |

#### 9. Segurança, privacidade e conformidade

- **Enumeração de tenants:** **proibida** em qualquer superfície pública. Não existe formulário aberto do tipo «digite o slug da sua loja» acessível sem contexto operador. O bootstrap `GET /painel/acesso/:slug` permanece **desligado** por padrão e **só** em desenvolvimento com flag explícita (**BZ-TOJ-006**).
- **Dados mostrados em telas públicos (login, erro):** apenas copy **não técnica** orientada a humanos; não revelar se um slug «existe mas está inativo» versus «não existe» de forma distinguível por mensagens diferentes que permitam **enumeração por oráculo**; alinhamento exato de formulação com **UX** após este PRD.
- **Cookies / subdomínios / Auth redirects:** cada app mantém o isolamento adequado de cookies no mesmo **site** de primeiro nível conforme desenho técnico; as **Redirect URLs** do Supabase Auth devem incluir todos os hosts de painel previstos (dev e prod); alterações a hosts são **pré-release** verificadas pela checklist da seção 12.

#### 10. Critérios de aceite (CA) — formato Given / When / Then

| ID | Critério |
| --- | --- |
| **CA-TOJ-001** | **Dado** um host `{slug}.localhost:3003` sem concessionária registrada com esse slug **quando** o visitante abre a raiz **então** é apresentada ou alcançada a página `/erro/concessionaria` com mensagem em português claro e **sem** título que invoque «erro 404» como substituto da explicação. |
| **CA-TOJ-002** | **Dado** uma concessionária existente com estado **diferente** de `active` **quando** o visitante abre a vitrine nesse host **então** **não** vê o site público da loja e é conduzido ao fluxo de erro de concessionária. |
| **CA-TOJ-003** | **Dado** uma concessionária `active` **quando** o operador no `admin-master` usa o atalho de vitrine **então** o browser abre `http://{slug}.localhost:3003` em desenvolvimento ou `https://{slug}.{domínio_plataforma}` em produção com conteúdo público coerente. |
| **CA-TOJ-004** | **Dado** a mesma concessionária `active` **quando** o operador usa o atalho de painel **então** o browser abre `http://{slug}.localhost:3002` em desenvolvimento ou `https://{slug}.{domínio_plataforma}` em produção na app `dealership-panel`. |
| **CA-TOJ-005** | **Dado** o slug canônico `MinhaLoja` na base e o host `minhaloja.localhost` **quando** se resolve o tenant **então** a loja correta é encontrada (correspondência **insensível** a maiúsculas/minúsculas). |
| **CA-TOJ-006** | **Dado** um usuário anônimo na Internet **quando** tenta enumerar slugs por tentativa sequencial de subdomínios **então** **não** existe página pública oficial que facilite ou incentive essa descoberta e as mensagens **não** confirmam existência de lojas por diferenças discriminatórias. |
| **CA-TOJ-007** | **Dado** `NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP` **falso** ou ambiente **não** de desenvolvimento **quando** se solicita `GET /painel/acesso/{slug}` **então** o comportamento não expõe um atalho de bootstrap reservado a desenvolvimento. |
| **CA-TOJ-008** | **Dado** `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` com valor de produção no `.env` **quando** o developer acede a `{slug}.localhost:3002` **então** o painel continua a resolver o tenant sem exigir alteração manual do domínio raiz para cada loja (raiz efetiva `localhost`). |
| **CA-TOJ-009** | **Dado** um colaborador na página de início de sessão do painel **quando** ocorre erro de credenciais ou de rede tratado pela UI **então** a mensagem está em português simples **sem** referências a «RPC», «middleware» ou stack técnica. |
| **CA-TOJ-010** | **Dado** ambiente de **produção** **quando** o usuário vê a página de erro de concessionária **então** **não** vê checklist técnica por padrão; **dado** ambiente de **desenvolvimento** e padrão UX aprovado **quando** expande a zona opcional de detalhes técnicos **então** pode ver checklist operacional sem que isso apareça em produção. |

#### 11. Fora de âmbito e riscos

**Fora de âmbito:** Novas funcionalidades de **marketing-site**; aplicações móveis nativas; alterações profundas ao modelo de **preços** ou **módulos** SaaS; implementação de **gateway de pagamento** automático; qualquer **API pública** de listagem de concessionárias por slug.

| Risco | Probabilidade / impacto | Mitigação |
| --- | --- | --- |
| DNS wildcard ou certificados incompletos em produção | Alta / alto — quebra de todos os subdomínios | Checklist pré-release (seção 12); validação Operations antes do «go live»; monitoramento de erros de TLS |
| Redirect URLs do Auth desatualizados após mudança de domínio | Média / alto — login impossível | Manter lista versionada na documentação técnica; reversão imediata ou hotfix de configuração |
| Equipe UX atrasada após este PRD | Média / médio — bloqueio deliberado de refinamento | PM agenda revisão com stakeholders; entrada formal na fila UX |
| Confusão entre porta **3002** e **3003** localmente | Média / baixo — operador abre app errada | Documentação interna com tabela explícita; labels no Admin «Painel (3002 dev)» apenas se UX aprovar |

#### 12. Dependências e checklist pré-release

- [ ] **DNS / TLS:** wildcard `{slug}.{domínio_plataforma}` e registros para domínios personalizados acordados com o cliente, quando aplicável.
- [ ] **Supabase Auth — Redirect URLs:** incluir URLs de `dealership-panel` para dev (`http://{slug}.localhost:3002/**`) e produção (`https://{slug}.{domínio_plataforma}/**`) conforme política de segurança do projeto.
- [ ] **Variáveis de ambiente por app:** `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, `NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP` (apenas dev), chaves Supabase publicáveis, e quaisquer variáveis listadas em `documentacao-tecnica.md` para resolução de host.
- [ ] **Comunicação a clientes (se aplicável):** Operations envia modelo de e-mail com os URLs finais e instruções de bookmark **após** DNS estável.

#### 13. Entrada para UX (PRD aprovado — decisões fechadas para handoff)

| Tópico | Decisão PM | Nota |
| --- | --- | --- |
| Tom de voz em erros e login | **Fechada** | **pt-BR**; tom simples, neutro ou segunda pessoa; sem jargão técnico em produção; baixa urgência em erro de tenant. |
| Checklist técnico visível em dev | **Fechada** | Permitido só em `development`, **atrás** de acordeão/disclosure (ex.: «Detalhes para a equipe técnica»); rótulo e hierarquia fechados em **13.2** (UX). |
| Botões no Admin (atalhos) | **Fechada** | Ordem: **Abrir painel** → **Abrir vitrine** (suporte tende a validar sessão no painel primeiro). Ícones e microcopy finos: UX ajusta sem alterar ordem nem contagem mínima (2 botões). Sem números de porta em rótulos de **produção**; em **dev**, só se UX aprovar hint curto. |

#### 13.1 Decisões PM — questões abertas encerradas (2026-05-08)

| ID | Decisão |
| --- | --- |
| **O1 — `www` vs ápice em `custom_domain`** | **Canônico em ápice** (`loja.com.br`): `www` redireciona com **301** para o ápice quando ambos apontarem para a AutoPainel; se só `www` estiver configurado, documentar exceção em Operations. Mensagens de erro **não** ensinam o usuário a «tentar com ou sem www» — comportamento deve ser transparente. |
| **O2 — Mensagem única vs variações (anti-oráculo)** | Na **vitrine pública**, usar **uma família de mensagem** para «não há loja neste endereço» tanto para host desconhecido quanto para loja existente porém **não** `active`, **sem** texto que revele estado interno. Operações e loja usam o Admin para diagnóstico. |
| **O3 — Link institucional AutoPainel na página de erro** | **Rodapé discreto**: link «Sobre a AutoPainel» ou texto equivalente **só** como secundário; **não** competir com o CTA principal («Confira o endereço com quem enviou o link» / variante UX). |
| **O4 — SLA Operations (baseline)** | **Primeira resposta** em **4 horas úteis** (dias comerciais definidos pela Operations) para tickets «site da loja não abre»; **meta interna** de resolução ou plano comunicado em **1 dia útil**. PM + Operations revisam baseline após 30 dias de uso. |
| **O5 — Ordem dos botões no Admin** | Ver linha «Botões no Admin» na tabela acima (**painel** antes de **vitrine**). |
| **O6 — Acessibilidade** | Alinhar às **WCAG 2.1 nível AA** nas páginas `/erro/concessionaria`, login e recuperação de senha do `dealership-panel` e `customer-site` — mesmo padrão mínimo do design system; sem exceção «abaixo do resto do produto». |

#### 13.2 Handoff UX — Fase 2 (rascunho para confirmação da equipe)

**Personas e metas (resumo)** — Visitante **mobile** (ver vitrine ou entender erro em 1 tela); **Comprador** vindo de anúncio (confiança de que é o site certo); **Colaborador** da loja (login sem medo); **Operador** Admin (dois cliques, mesma loja); **Gestor** da loja (saber a quem escalar).

**Jornada principal (operador)** — Abrir ficha da concessionária `active` → **Abrir painel** → confirmar tenant → voltar ou abrir **Abrir vitrine** → confirmar vitrine pública.

**Inventário de telas / estados** — Admin: cartão de atalhos (2 CTAs + opcional «copiar URLs» em texto monoespaçado só em dev se já existir). Painel/vitrine: `/erro/concessionaria` (título, corpo, CTA primário, CTA secundário opcional, rodapé institucional discreto); login, recuperar senha, definir senha; loading esquelético se houver delay de resolução de host.

**Whitelabel e responsivo** — Erro e auth respeitam tokens do design system; em mobile, CTA principal **acima da dobra**; contraste AA; foco visível em teclado. Configuração da loja passa a incluir **Tema base da vitrine** (`Claro`/`Escuro`) para controlar fundo e superfícies do `customer-site` sem exigir edição manual de hex para cada concessionária.

**Casos de borda (UX)** — Teclado RTL não aplicável; zoom 200%; leitor de tela: ordem de leitura título → explicação → ação; `custom_domain` com redirecionamento `www`; loja `suspended` na vitrine (mensagem idêntica à de host inválido); dev: acordeão técnico fechado por padrão.

**Pausa squad** — **Handoff UX confirmado** (equipe, 2026-05-08). **Fase 3** em `documentacao-tecnica.md`; **Fase 4** (UI `/erro/concessionaria` + refresh visual do Admin + tema claro/escuro por loja na vitrine); **Fase 5** (matriz QA + E2E) na mesma doc. **Fase 6** (sprint review) — ver quadro «Fase 6» em `documentacao-tecnica.md`.

---

### 2026-05-08 — Iniciativa: Central de gestão, financeiro e permissões (Admin Master) (PRD — Passo A)

| Campo | Valor |
| --- | --- |
| **Nome** | Central de gestão da concessionária (`dealership_management_hub`) |
| **Status** | Passo A (PRD/BZ); Passo B parcial na base e no `dealership-panel` (bloqueio inativo); UI tabs admin e relatórios — execução contínua |
| **Apps** | `admin-master`, `dealership-panel`, `customer-site` (bloqueios de vitrine já alinhados a `status`) |
| **Objetivo** | Concentrar edição da loja: pessoas colaboradoras e RBAC, acordo SaaS com a AutoPainel, histórico de cobrança, notas internas, auditoria e alertas de atraso |

#### Problema

Falta um núcleo único no Admin Master para **pessoas**, **permissões** e **financeiro SaaS**, com trilho de auditoria e estados claros para o ciclo de vida da concessionária.

#### Linguagem (inclusiva)

Documentação e interfaces: «pessoas usuárias», «pessoas colaboradoras», «pessoas gestoras», «pessoas vendedoras». Código/`profiles.role`: `owner`, `manager`, `seller`, `super_admin`.

#### Ciclo de vida (`dealerships.status`)

| Estado | UX | Observação |
| --- | --- | --- |
| `active` | Loja operacional | Vitrine pública disponível quando as RPCs o permitem (`active`). Painel disponível para JWT válidos. |
| `suspended` | Sem vitrine pelo host público | Painel: bloquear com página **Conta inativa**. |
| `pending_setup` | MVP alinhado a bloqueio de painel até conclusão — **PM pode relaxar** para permitir apenas *setup*. |
| `churned` | Encerrada | Sem acesso público nem painel. |

#### Inadimplência

Modelada em **`dealership_billing` + `dealership_billing_history`**. Estado **«atrasado»** é derivado de dados de histórico (e regras de calendário), **não** é obrigatoriamente o mesmo campo que `subscription_status`; a **suspensão automática** da loja por falta de pagamento é **BZ opcional** a fechar com o PM (N dias, avisos, etc.).

#### Papéis (RBAC)

- **`seller`**: sem acesso a ecrãs/APIs do **financeiro SaaS** (mensalidades da relação AutoPainel) quando implementados no admin apenas com `super_admin`.
- **`manager`**, **`owner`**: operação da loja; gestão de pessoas e leads conforme migrações (ver técnico).
- **`super_admin`**: Central de gestão e tabelas de cobrança/auditoria.

#### Escopo MVP (in)

1. Abas: Geral, Whitelabel, Módulos, Pessoas, Financeiro (operador).  
2. CRUD/colaboradores e convites Auth.  
3. Acordo: valor mensal, dia de vencimento (1–28 recomendado), método de pagamento; histórico com **Pago / Pendente / Atrasado**.  
4. Notas internas (operador).  
5. Alerta visual listagem quando há cobrança atrasada (query sobre histórico).  
6. Audit log minimal em `platform_audit_logs`.

#### Fora do escopo (out)

Gateway de cobrança automática; modelo fiscal completo.

#### Cenários de aceite

- **CA-001:** `seller` não acede ao financeiro SaaS quando exposto apenas no admin com políticas restritas.  
- **CA-002:** Estado operacional não ativo ⇒ painel não serve área principal; página **«Conta inativa»** em PT.  
- **CA-003:** Histórico com linha pendente há mais de período ⇒ alerta administrativo configurável.

---

### 2026-05-07 — Módulo: Kit de redes sociais com postagem automática integrada (Meta) (PRD MVP aprovado)

| Campo | Valor |
| --- | --- |
| **Nome** | Kit de redes sociais com automação de publicação (`social_media_kit`) |
| **Status** | **OAuth + dados + página Integrações** entregues (Passo C parcial); aguardando pipeline de imagens/postagem e homologação App Meta |
| **Apps** | `dealership-panel` (conexões Meta, finalização de veículo com opção de postar), Supabase (credenciais cifradas, fila de jobs, storage de artefatos), Edge Functions (OAuth callback, worker de publicação) |
| **Objetivo de negócio** | Reduzir fricção de marketing: gerar carrossel whitelabel e publicar no Instagram Feed e na Facebook Page sem download manual |

#### Problema

O lojista perde tempo baixando imagens e republicando manualmente nas redes; o estoque já está no AutoPainel, mas o ganho de visibilidade social depende de passos paralelos propensos a falha ou atraso.

#### Personas

- **Gestor / marketing da concessionária:** quer conectar Meta uma vez e publicar com confirmação clara na finalização do cadastro.
- **Operacional de estoque:** precisa da opção de postar sem travar o fluxo de salvamento do veículo.
- **Operação AutoPainel:** deve garantir RLS tenant, segurança de tokens e auditoria sem expor segredos no cliente.

#### Escopo MVP (in)

1. Secção **Conexões** no `dealership-panel` (integrável à página de integrações ou sub-secção dedicada Meta).
2. Botão **«Conectar Facebook / Instagram»** com OAuth2 oficial da Meta via **popup segura** (fluxo tipo “um clique” para iniciar; consentimento sempre no domínio Meta).
3. Scopes pretendidos ao produto: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_manage_posts` (lista final submete-se à revisão do App Meta e políticas vigentes).
4. Armazenamento de tokens **long-lived** (e metadados de página / IG Business Account ID) **cifrados**, com **RLS estrito** por `dealership_id`.
5. **Motor de imagens:** sequência fixa MVP em **1080×1080** — capa, fotos do veículo com watermark da logo, slide de encerramento com CTA.
6. **Três templates visuais** injetados dinamicamente nos assets: Classic/Clean, Performance/Bold, Tech/Modern (definição pixel-perfect no Passo UX).
7. No **final do cadastro/editar veículo** (quando o módulo estiver ativo): checkboxes **«Postar no Instagram Feed»** e **«Postar na Facebook Page»** + botão **«Guardar / Finalizar e postar»** (copy em PT conforme UX).
8. Pipeline **assíncrono:** após criar/atualizar veículo, enfileirar job; UI mostra estado da publicação (**a aguardar / a publicar / publicado / erro**) sem bloquear a resposta HTTP da gravação.
9. Tratamento de **expiração de tokens**: refresh automático quando possível; estado `reconnect_required` e CTA de reconectar quando falhar.

#### Fora do escopo MVP (out)

1. Agendamento de posts (cron social).
2. Stories, Reels, anúncios pagos Meta Ads Manager.
3. LinkedIn / TikTok / outros canais.
4. Editor livre tipo Canva dentro do produto.

#### Regras de negócio (BZ)

1. **BZ-001 (gating):** todas as superfícies (conexões, checkboxes, fila de post) aparecem só com `social_media_kit` efetivo no plano da loja.

2. **BZ-002 (OAuth):** o gestor inicia **«Conectar»** após configurar (no painel) o **App ID** e **App Secret** da app Meta da loja — ou, só em desenvolvimento, existe fallback via variáveis `META_APP_*` no servidor. O utilizador final **não** cola access tokens; o consentimento OAuth2 abre em popup no domínio Meta.

3. **BZ-003 (validação PKCE/state):** o callback da Meta deve validar `state` (e PKCE quando adotado) antes de gravar sessão/conexão.

4. **BZ-004 (armazenamento seguro):** apenas campos sensíveis cifrados no armazém dedicado (`access_token`/refresh conforme modelo Meta); cliente nunca lê ciphertext.

5. **BZ-005 (isolamento multitenant):** loja A não acessa nem altera conexões nem jobs de social da loja B.

6. **BZ-006 (tokens long-lived e expiração):** após conexão, o backend deve converter para tokens de longa duração conforme política Meta; registar `token_expires_at` quando aplicável.

7. **BZ-007 (refresh e degradação graciosa):** antes de publicar, tentar refresh se o token estiver perto ou após erro 190/expired; falha repetida ⇒ marcar `reconnect_required` e notificar na UI sem bloquear o inventário.

8. **BZ-008 (estrutura do post):** carrossel = **N slides** obrigatórios no MVP — capa, pelo menos uma foto com watermark logo, slides com fotos adicionais (até máximo MVP definido pela UX/engineering), encerramento CTA — todos 1080×1080 PNG ou JPEG aceite pela Graph API.

9. **BZ-009 (templates):** tema visual escolhido por loja ou por formulário (**classic** | **performance** | **tech**) antes de gerar arte.

10. **BZ-010 (opcionalidades no formulário):** checkboxes só ativos se conta Meta ligada ao canal correspondente (ex.: sem IG ligado ⇒ desabilitar IG).

11. **BZ-011 (persistência primeiro):** o veículo deve ser gravado com sucesso independentemente da fila social; erro de redes não reverte dados do stock (estado falhado apenas no job).

12. **BZ-012 (auditabilidade):** eventos `meta_oauth_*`, `social_post_*` registados por tenant (sem segredos no payload de log público ao utilizador).

#### Critérios de aceite (CA)

1. **CA-001:** gestor completa OAuth Meta na popup e vê estado **Conectado** com página e conta Instagram Business identificável na UI não sensível.
2. **CA-002:** recusa de permissões ⇒ estado de erro recuperável + botão repetir fluxo.
3. **CA-003:** ao finalizar veículo com ambas checkboxes marcadas e conectividade válida, job entra como **queued** e concluí com IG carrossel + FB publicação públicos bem-sucedidos (ambiente homologação).
4. **CA-004:** página de resultado do formulário mostra estado **«A publicar…»** e depois **«Publicado»** ou **«Erro»** com mensagem em português.
5. **CA-005:** falha ao meio do upload IG (slide k de N): job marcam **failed** por canal; não é afirmado “rollback transacional na Meta”; sistema pode limpar recursos já criados (ex. temporary upload URLs) onde a API Meta permitir; utilizador pode **reintentar post** sem duplicar veículo.
6. **CA-006:** token expirado irrecuperável ⇒ **Reconectar** visível até nova autorização.

#### Dependências e entregáveis obrigatórios

- Aplicação Meta **da concessionária** (App ID e App Secret registados no painel em `dealership_meta_oauth_apps`); redirect URI da Edge Function `meta-oauth-callback` aprovados nessa mesma app; `META_APP_CLIENT_ID` / `META_APP_CLIENT_SECRET` no ambiente **opcionais** em produção (fallback dev).
- PM/UX fecha copy e limites do carrossel (máximo de fotos, ordem obrigatória).
- QA executar matriz OAuth + IG carousel + FB + falhas parciais (ver secção QA em `documentacao-tecnica.md`).

---

### 2026-05-06 — Módulo: Integração com Classificados (OLX & WebMotors) (PRD MVP aprovado)

| Campo | Valor |
| --- | --- |
| **Nome** | Integração com classificados (`classifieds_sync`) |
| **Status** | **Passo C inicial implementado e aplicado** (scaffold técnico + migração + deploy callback); pendente integração homologada com credenciais reais e QA final |
| **Apps** | `dealership-panel` (conexão, status e ações), Supabase (credenciais OAuth2, filas/eventos de publicação), Edge Functions OAuth2/callback/sync |
| **Objetivo de negócio** | Permitir conexão simples com OLX e WebMotors para publicar/baixar anúncios automaticamente sem exigir operação técnica do lojista |

#### Problema

Hoje o lojista precisa operar publicação manual em classificados, com alto risco de atraso entre estoque real e anúncios externos. Além disso, fluxos técnicos de credencial criam fricção operacional e diminuem adoção.

#### Personas

- **Gestor da concessionária:** quer conectar portais por clique, sem copiar chaves/tokens manualmente.
- **Time comercial da loja:** precisa garantir que veículo vendido seja removido rapidamente dos portais.
- **Operação AutoPainel:** precisa manter integração segura, auditável e isolada por tenant.

#### Escopo MVP (in)

1. Página de Integrações no `dealership-panel` com cards de OLX e WebMotors.
2. Botão “Conectar [Portal]” abrindo popup segura para autorização OAuth2 oficial do portal.
3. Callback OAuth2 em Edge Function para troca de `code` por `access_token`/`refresh_token`.
4. Persistência segura de credenciais por concessionária e por portal.
5. Atualização automática do status no painel: `desconectado`, `conectando`, `conectado`, `erro`.
6. Publicação de veículo para portal conectado.
7. Baixa automática no portal quando veículo virar vendido/inativo no AutoPainel.
8. Renovação de token com `refresh_token` sem interação manual do lojista.

#### Fora do escopo MVP (out)

1. Edição avançada de anúncios com estratégia de preço por portal.
2. Sincronização bidirecional completa de leads vindos dos portais.
3. Relatórios financeiros avançados de ROI por portal/campanha.
4. Suporte a mais portais além de OLX e WebMotors.

#### Regras de negócio (BZ)

1. **BZ-001 (gating por módulo):** recursos de integração só aparecem quando `classifieds_sync` estiver ativo para a concessionária.
2. **BZ-002 (ux um clique):** conexão deve iniciar por um único clique no botão do portal, sem exigir input manual de token/chave na UI.
3. **BZ-003 (popup oficial):** autenticação sempre ocorre em popup apontando para URL oficial de autorização do portal (OAuth2).
4. **BZ-004 (callback seguro):** callback deve validar `state` (e PKCE quando exigido pelo provedor) antes de trocar `code` por tokens.
5. **BZ-005 (fechamento automático):** ao concluir autorização, popup deve fechar automaticamente e sinalizar o painel principal para atualizar status.
6. **BZ-006 (persistência segura):** `access_token` e `refresh_token` devem ser armazenados de forma criptografada e segregados por `dealership_id` + `provider`.
7. **BZ-007 (publicação):** publicação só é permitida para veículos da própria loja e somente quando o portal estiver `conectado`.
8. **BZ-008 (baixa automática):** alteração de status de veículo para vendido/inativo deve enfileirar baixa no(s) portal(is) conectado(s).
9. **BZ-009 (renovação):** token expirado deve acionar rotina de refresh automática; falha de refresh muda status para `erro_reautenticacao`.
10. **BZ-010 (isolamento):** loja A jamais pode ler, atualizar, usar ou disparar ações com credenciais da loja B.
11. **BZ-011 (auditabilidade):** toda ação crítica (connect, refresh, publish, delist, erro) deve gerar log de auditoria técnico por tenant.

#### Critérios de aceite (CA)

1. **CA-001:** gestor clica “Conectar OLX”, autentica no popup e retorna ao painel com status `conectado`.
2. **CA-002:** gestor clica “Conectar WebMotors”, autentica no popup e retorna ao painel com status `conectado`.
3. **CA-003:** se usuário negar consentimento no popup, painel exibe status de erro amigável com ação “Tentar novamente”.
4. **CA-004:** veículo da loja conectada pode ser publicado no portal sem erro de autorização.
5. **CA-005:** ao marcar veículo como vendido, sistema executa baixa automática no portal e registra resultado.
6. **CA-006:** em token expirado com refresh válido, integração segue operando sem ação manual do gestor.
7. **CA-007:** em refresh inválido/expirado, status muda para `erro_reautenticacao` e o painel solicita reconexão por clique.
8. **CA-008:** usuário autenticado da loja A não consegue acessar credenciais nem anúncios sincronizados da loja B.

#### Dependências e entregáveis obrigatórios

- UX/UI deve entregar página de Integrações com estados dos cards/botões e fluxo visual de popup.
- Arquitetura deve definir tabelas de credencial criptografada + Edge Functions de OAuth2 e callback.
- Devs devem gerar prompts técnicos detalhados para frontend popup, backend OAuth2, publicação e baixa automática.
- QA deve validar fluxos de sucesso, recusa, refresh expirado e isolamento RLS multi-tenant.

---

### 2026-05-06 — Módulo: Métricas Avançadas (PRD MVP aprovado)

| Campo | Valor |
| --- | --- |
| **Nome** | Métricas Avançadas da concessionária (`advanced_metrics`) |
| **Status** | **Passo C implementado no repositório**; pendente aplicar migração de views no Supabase e executar QA final |
| **Apps** | `dealership-panel` (dashboard), `customer-site` (contagem de views), `packages/shared` (tipos/contratos), Supabase (agregações e RLS) |
| **Objetivo de negócio** | Entregar visão analítica acionável para gestão de estoque e performance de leads da concessionária |

#### Problema

Hoje a loja consegue operar estoque e leads, mas não possui uma visão analítica consolidada para decidir ações comerciais (precificação, giro de pátio, campanhas e eficiência de captação). Sem métricas fidedignas, o gestor depende de leitura manual e fragmentada.

#### Personas

- **Gestor da concessionária:** quer acompanhar saúde do estoque, qualidade de captação e evolução por período.
- **Vendedor/coordenador:** usa métricas para priorizar veículos com baixo giro e orientar abordagem comercial.
- **Operação da plataforma:** precisa garantir que o módulo respeite isolamento multi-tenant.

#### Escopo MVP (in)

1. Dashboard de métricas dentro do `dealership-panel`.
2. Cards de visão geral de estoque:
   - total de veículos ativos
   - valor estimado total do estoque ativo
   - média de dias em estoque (stock aging)
3. Bloco de performance de leads em janela configurável:
   - total no período
   - comparação com período anterior
   - distribuição por origem (`contact` vs `simulation`)
4. Top 5 veículos mais visualizados na vitrine.
5. Gating por módulo `advanced_metrics`.

#### Fora do escopo MVP (out)

1. Segmentações avançadas por campanha/canal pago.
2. Exportações BI (CSV/PDF) e conectores externos.
3. Alertas automáticos por metas (meta de conversão, SLA etc.).
4. Modelos preditivos de venda.

#### Regras de negócio (BZ)

1. **BZ-001 (gating por módulo):** o dashboard avançado só é exibido quando `advanced_metrics` estiver habilitado para a concessionária.
2. **BZ-002 (estoque ativo):** total e valor de estoque consideram apenas veículos com `status = 'available'`.
3. **BZ-003 (stock aging):** dias em estoque são calculados por veículo ativo com base em `created_at` (ou data de entrada oficial quando disponível), usando média aritmética no período corrente.
4. **BZ-004 (janela de análise):** métricas de leads devem aceitar janela configurável (MVP: últimos 7, 30 e 90 dias), sempre com comparativo equivalente do período anterior.
5. **BZ-005 (origem de lead):** origem fidedigna deve refletir `leads.type`, no mínimo separando `contact` e `simulation`.
6. **BZ-006 (views de vitrine):** contagem de visualizações de veículo deve ser registrada no `customer-site` de forma idempotente por evento, sem quebrar performance da página.
7. **BZ-007 (top veículos):** ranking top 5 ordenado por views no período selecionado, com desempate por recência.
8. **BZ-008 (isolamento tenant):** nenhuma métrica pode incluir dados de outra concessionária (estoque, leads ou views).
9. **BZ-009 (resiliência):** falhas pontuais de uma métrica não devem derrubar o dashboard inteiro; UI deve apresentar estado parcial com mensagem clara.

#### Critérios de aceite (CA)

1. **CA-001:** com módulo habilitado, gestor visualiza cards de estoque (total, valor, aging) com valores consistentes ao banco da própria loja.
2. **CA-002:** total de leads no período e comparativo do período anterior são exibidos corretamente para 7/30/90 dias.
3. **CA-003:** gráfico/distribuição de origem de leads mostra `contact` e `simulation` com soma igual ao total de leads do período.
4. **CA-004:** top 5 veículos mais visualizados exibe dados da própria concessionária e abre o detalhe correto do veículo.
5. **CA-005:** usuário da loja A não consegue visualizar métricas da loja B em nenhum endpoint do dashboard.
6. **CA-006:** com módulo desabilitado, dashboard avançado não aparece e o painel mostra fallback claro.
7. **CA-007:** layout permanece legível e responsivo em desktop e tablet (cards e gráficos sem sobreposição).

#### Dependências e entregáveis obrigatórios

- UX/UI deve entregar composição de dashboard com cards + gráficos usando componentes shadcn do design system compartilhado.
- Arquitetura deve definir contrato API-first para agregações e estratégia de coleta de views.
- Devs devem gerar prompts técnicos detalhados para backend/frontend e telemetria de views.
- QA deve validar precisão matemática e isolamento RLS como prioridade crítica.

---

### 2026-05-06 — Módulo: Gerador de QR Code para veículos (PRD MVP aprovado)

| Campo | Valor |
| --- | --- |
| **Nome** | Gerador de QR Code para veículos (`qr_generator`) |
| **Status** | **Passo C implementado no repositório**; executar QA de escaneamento e impressão para conclusão |
| **Apps** | `dealership-panel` (fluxo principal), `customer-site` (URL destino), `packages/shared` (tipos/URL helpers), Supabase (RLS e dados de veículo) |
| **Objetivo de negócio** | Aumentar tráfego qualificado da loja física para a vitrine digital com um artefato de venda imprimível e rastreável por veículo |

#### Problema

Na operação de pátio/loja física, o cliente vê o veículo, mas perde-se conversão digital por falta de um atalho imediato para a página pública do veículo. O time comercial precisa gerar uma lâmina/etiqueta padronizada com QR escaneável para acelerar acesso aos detalhes e jornada de contato/simulação.

#### Personas

- **Gestor da concessionária:** precisa gerar e imprimir QR por veículo ativo com baixo esforço operacional.
- **Vendedor de loja:** precisa de material físico confiável para colocar no carro/mesa.
- **Comprador final (visitante presencial):** escaneia e abre rapidamente a página pública daquele veículo.

#### Escopo MVP (in)

1. Botão **“Gerar QR Code”** na listagem de estoque do `dealership-panel`.
2. Geração de QR apontando para a URL pública canônica do veículo no `customer-site`.
3. Visualização de impressão (“Lâmina de Venda”) com:
   - QR Code
   - logo da concessionária
   - marca/modelo/ano/preço
   - CTA de escaneamento
4. Modo de impressão com CSS `print` para A4 e versão compacta (etiqueta).
5. Gating por módulo (`qr_generator`) conforme plano/módulos efetivos.

#### Fora do escopo MVP (out)

1. Analytics avançado por escaneamento (UTM, campanha, dashboard dedicado).
2. Personalização livre de layout da lâmina por usuário final.
3. Geração em lote com ZIP/PDF de centenas de veículos.
4. Integrações externas com impressoras térmicas proprietárias.

#### Regras de negócio (BZ)

1. **BZ-001 (gating por módulo):** o botão “Gerar QR Code” só aparece quando `qr_generator` estiver habilitado para a concessionária nas chaves efetivas.
2. **BZ-002 (escopo de estoque):** apenas veículos ativos/disponíveis podem gerar lâmina de QR no MVP.
3. **BZ-003 (URL canônica):** a URL no QR deve apontar para o veículo correto usando o domínio da loja (custom domain quando existir; fallback para subdomínio/plataforma).
4. **BZ-004 (isolamento):** a concessionária A não pode gerar QR de veículo pertencente à concessionária B.
5. **BZ-005 (dados exibidos):** a lâmina deve mostrar logo (se houver), marca, modelo, ano e preço com formatação pt-BR.
6. **BZ-006 (CTA padrão):** exibir chamada de ação em português (“Escaneie para ver detalhes e simular financiamento” ou equivalente aprovado).
7. **BZ-007 (impressão):** a visualização deve ser legível e escaneável em impressão comum, mantendo contraste mínimo para QR.
8. **BZ-008 (resiliência):** falhas de geração/render devem apresentar erro amigável sem travar a tela de estoque.

#### Critérios de aceite (CA)

1. **CA-001:** usuário gestor na loja A clica “Gerar QR Code” de um veículo da própria loja e visualiza lâmina com QR válido.
2. **CA-002:** QR da lâmina abre a página pública do veículo correspondente (slug correto e tenant correto).
3. **CA-003:** para veículo indisponível/inativo, o botão não aparece ou ação é bloqueada com mensagem clara.
4. **CA-004:** impressão em A4 mantém QR escaneável e conteúdo legível em Chrome e Edge (desktop).
5. **CA-005:** em ambiente com `custom_domain`, o QR usa esse domínio; sem ele, usa fallback de plataforma.
6. **CA-006:** tentativa de gerar QR para veículo de outro tenant resulta em bloqueio por RLS/autorização.
7. **CA-007:** quando `qr_generator` estiver desabilitado no plano, recurso não é exibido no painel.

#### Dependências e entregáveis obrigatórios

- UX deve entregar wireframe da lâmina (A4 + etiqueta) e regras visuais para print.
- Arquitetura deve definir contrato API-first para resolver URL final e payload da lâmina.
- Devs devem gerar prompts técnicos detalhados por etapa (backend/frontend/print).
- QA deve validar escaneabilidade em dispositivo real + isolamento por tenant.

---

### 2026-05-06 — Módulo: Simulador de financiamento (PRD MVP aprovado)

| Campo | Valor |
| --- | --- |
| **Nome** | Simulador de financiamento (`finance_simulator`) |
| **Status** | **Passo C implementado no repositório** (aplicar migração `20260506173000_platform_finance_settings.sql` no ambiente e executar QA para conclusão) |
| **Apps** | `customer-site` (whitelabel), `admin-master` (configuração global), `packages/shared` (cálculo/tipos), Supabase (`leads`) |
| **Objetivo de negócio** | Aumentar geração de lead qualificado na vitrine com fricção mínima e sem dependência de API bancária na fase inicial |

#### Problema

Visitantes da vitrine avaliam preço de veículo, mas abandonam antes de converter por não terem uma estimativa simples de parcela. A concessionária perde intenção de compra qualificada por ausência de um fluxo rápido de simulação + captura de contato no mesmo contexto do veículo.

#### Personas

- **Comprador final (visitante):** quer estimar parcela com entrada e prazo antes de decidir contato.
- **Concessionária (time comercial):** quer receber lead já qualificado com parâmetros da simulação.
- **Operação plataforma (super admin):** quer controlar taxa global e preparar futura customização por loja.

#### Escopo MVP (in)

1. Componente whitelabel no `customer-site` para simulação por veículo.
2. Cálculo interno com juros compostos (Tabela Price), sem integração bancária externa.
3. Taxa de juros mensal configurada globalmente no `admin-master`.
4. Entradas do visitante: valor de entrada + prazo (24, 36, 48, 60 parcelas).
5. Após calcular, coleta obrigatória de nome e WhatsApp para envio.
6. Persistência em `leads` vinculando `dealership_id` e `vehicle_id`.

#### Fora do escopo MVP (out)

1. Integrações com bancos/financeiras (Santander, BV, etc.).
2. Aprovação de crédito, score, antifraude, assinatura digital.
3. Taxa por concessionária na UI (fica preparada em contrato técnico para fase seguinte).
4. Simulações com carência, balão ou múltiplas modalidades no mesmo fluxo.

#### Regras de negócio (BZ)

1. **BZ-001 (gating por módulo):** o simulador só aparece quando `finance_simulator` estiver habilitado para a concessionária nas chaves efetivas do plano ativo.
2. **BZ-002 (base de cálculo):** o valor financiado é `valor_veiculo - valor_entrada`. Se o resultado for menor ou igual a zero, não há simulação válida.
3. **BZ-003 (fórmula):** a parcela estimada deve usar Tabela Price (juros compostos mensais):  
   `parcela = pv * (i * (1 + i)^n) / ((1 + i)^n - 1)`, com `pv` = principal financiado, `i` = taxa mensal, `n` = número de parcelas.
4. **BZ-004 (prazos permitidos):** somente 24x, 36x, 48x e 60x no MVP.
5. **BZ-005 (taxa global):** a taxa mensal usada no cálculo vem da configuração global do `admin-master`; na ausência de valor válido, usar fallback técnico documentado e registrar observabilidade.
6. **BZ-006 (disclaimer):** o resultado deve ser exibido como **estimativa** (não proposta formal de crédito), com texto legal em português.
7. **BZ-007 (captura pós-simulação):** somente após cálculo válido, solicitar e validar Nome + WhatsApp antes de salvar lead.
8. **BZ-008 (lead qualificado):** ao enviar, registrar em `leads` os campos mínimos de simulação: `dealership_id`, `vehicle_id`, valor do veículo, entrada informada, prazo, taxa aplicada, parcela estimada, nome e WhatsApp.
9. **BZ-009 (isolamento multi-tenant):** cada lead deve permanecer isolado por concessionária; nenhuma operação de leitura da loja A pode expor lead da loja B.
10. **BZ-010 (resiliência):** erro de persistência deve retornar mensagem amigável em português ao visitante e não quebrar a página da vitrine.

#### Critérios de aceite (CA)

1. **CA-001:** em loja com módulo habilitado, visitante consegue informar entrada e selecionar 24/36/48/60, recebendo parcela estimada sem reload da página.
2. **CA-002:** em loja sem módulo habilitado, o componente de simulação não é exibido.
3. **CA-003:** com entrada maior ou igual ao valor do veículo, o sistema bloqueia envio e orienta ajuste de valores.
4. **CA-004:** após simulação válida, formulário exige Nome e WhatsApp antes de permitir salvar.
5. **CA-005:** lead salvo contém `dealership_id` e `vehicle_id` corretos, além do snapshot da simulação (entrada, prazo, taxa e parcela).
6. **CA-006:** usuário autenticado da loja A não visualiza lead da loja B em nenhum endpoint/página autorizada.
7. **CA-007:** cálculo mantém consistência numérica para cenários de borda (entrada zero, taxa baixa, prazo máximo de 60).
8. **CA-008:** UI apresenta disclaimer de estimativa em português.

#### Dependências e entregáveis obrigatórios

- UX deve entregar wireframe de componente whitelabel e estados (vazio, sucesso, erro).
- Arquiteto/backend deve definir contrato API-first e local da função de cálculo em código compartilhado.
- Devs devem gerar prompts técnicos detalhados por etapa (backend e frontend) antes da implementação.
- QA deve validar cálculo + isolamento RLS por concessionária antes de concluir sprint.

---

### 2026-05-04 — Seleção e aplicação de templates dinâmicos (customer-site)

| Campo | Valor |
| --- | --- |
| **Nome** | Seleção e aplicação de templates dinâmicos no site da concessionária |
| **Status** | **Passo C implementado no repo** — aplicar migração `20260504203000_dealerships_layout_id.sql` no Supabase e rodar QA (Passo D) antes de marcar produção «Done» |
| **Apps** | `admin-master`, `customer-site`, `packages/shared`, Supabase (`dealerships`) |

#### Referência estrutural (não é identidade visual)

Arquivos de referência **somente grid/regiões**: `layout1.html`, `layout2.html`, `layout3.html`.

- **Layout 1**: hero alto com imagem full-blede e conteúdo/CTAs predominantes à esquerda sobre o banner (gradiente lateral).
- **Layout 2**: hero em tela cheia centralizado, indicação de scroll; bloco duas colunas (texto + imagem); inventário em grade de **duas colunas** com cards grandes.
- **Layout 3**: hero alto centralizado; grade de inventário em até **quatro colunas** no desktop; bloco tipo **bento** (grid 12) para destaques/serviços.

_Nota de produto_: nos HTMLs não há «busca lateral»; se isso for obrigatório para o layout 2, tratar como **delta** em relação aos anexos no refinamento UX.

#### Problema (original)

Não havia seleção explícita de **estrutura de storefront** por concessionária; o whitelabel (`theme_config`) existia, mas faltava `layout_id` e composição de UI por template mantendo cores/fontes/logos por loja.

**Entrega no código:** coluna `layout_id`, formulário no admin e variantes na vitrine (`customer-site`) conforme Passo C neste arquivo.

#### Escopo

**Inclui**: persistir `layout_id` ∈ {1, 2, 3}; UI no admin para escolha; customer-site resolve tenant por hostname e monta shell conforme ID; tema injetado por CSS variables / tokens (sem copiar paleta dos mocks).

**Fora deste PRD (por ora)**: mais de três templates; editor visual; política fina de CDN/cache (definir no Passo B).

#### Onboarding — campos mínimos sugeridos

**Básicos:** nome fantasia, razão social, CNPJ, endereço, WhatsApp (leads).

**Técnicos/DNS:** slug (subdomínio), domínio customizado.

**Identidade:** logos, favicon, cores primária/secundária (hex), seleção de fonte em lista **fechada** (refinamento técnico).

**Sistema:** plano de assinatura; **seleção de template (1, 2 ou 3)**.

#### Regras de negócio (BZ)

1. **BZ-001**: Uma concessionária tem um único `layout_id` em {1, 2, 3}; default na criação = **1** (ajustável pelo produto).
2. **BZ-002**: O customer-site não mistura estruturas por sessão: mesmo host ⇒ mesmo template (salvo exceções futuras documentadas).
3. **BZ-003**: Cores, tipografia e logos vêm sempre da concessionária atual; referências HTML **não** fixam identidade.
4. **BZ-004**: Alteração de `layout_id` reflete após próximo carregamento (detalhar cache no refinamento).
5. **BZ-005**: Host inválido ou loja inexistente mantém comportamento atual da plataforma (sem regressão silenciosa).
6. **BZ-006**: Apenas fluxos administrativos autorizados alteram `layout_id` e tema.

#### Critérios de aceite

1. **CA-001**: Dois hosts diferentes exibem cada um seu `layout_id` e `theme_config`, sem mistura visual.
2. **CA-002**: Salvar no admin persiste `layout_id` no Supabase e reabre o formulário com valor correto.
3. **CA-003**: Mesmos dados de vitrine + apenas mudança de `layout_id` altera regiões/grid conforme referência do layout escolhido.
4. **CA-004**: Mudar só cores/logos na loja A atualiza apenas A.
5. **CA-005**: Fonte permitida aplica headings/body de forma consistente nos três layouts (baseline CLS no refinamento UX).
6. **CA-006**: Visitante anônimo não altera `layout_id`.

---

## 2026-05-14 — Padronização visual + catálogo de veículos (incremental)

### Regras de negócio (BZ)

1. **BZ-007**: Todas as aplicações (`admin-master`, `dealership-panel`, `customer-site`, `marketing-site`) devem apresentar estado de carregamento com skeleton, mantendo padrão visual mínimo entre rotas.
2. **BZ-008**: O `dealership-panel` mantém fundo claro fixo; personalização de tema (claro/escuro, cores e fontes) continua exclusiva da vitrine.
3. **BZ-009**: Cadastro/edição de veículo passa a exigir `tipo de veículo` (lista fechada com opção `outro` + descrição personalizada quando aplicável).
4. **BZ-010**: Veículo passa a aceitar `valor FIPE` e `valor de venda`; valor de venda é a referência operacional/publicada.
5. **BZ-011**: Veículo com `is_active = false` não pode ser acessado/publicado na vitrine pública, mesmo com slug/id válido.
6. **BZ-012**: Veículo pode receber flag de destaque para uso futuro de merchandising nas vitrines e listagens.

### Critérios de aceite

1. **CA-007**: Navegação entre rotas mostra skeleton consistente em todas as aplicações.
2. **CA-008**: Painel da loja mantém fundo claro durante navegação e boundary de autenticação.
3. **CA-009**: Formulário de veículo permite selecionar tipo padrão ou cadastrar tipo personalizado.
4. **CA-010**: Valor FIPE e valor de venda persistem e reaparecem na edição.
5. **CA-011**: Veículo inativo não é retornado pelas RPCs públicas de listagem/detalhe.
6. **CA-012**: Flag de destaque persiste para uso futuro sem quebrar o fluxo atual.

---

## Template sugerido (novas funcionalidades)

### Funcionalidade

- **Nome:**
- **Status:** rascunho | em desenvolvimento | em produção

### Problema

Descreva o problema da pessoa usuária ou da operação.

### Regras de negócio (BZ)

1. BZ-001 — …
2. BZ-002 — …

### Cenários de aceite

- **CA-001:** …
- **CA-002:** …
