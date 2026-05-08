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
| Templates dinâmicos da vitrine | `layout_id` | Implementado e registrado | Esta página + `documentacao-tecnica.md` |

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

2. **BZ-002 (OAuth por popup):** o lojista inicia com um clique “Conectar…”; autorização OAuth2 ocorre em popup/fora da app; não exigir colar tokens manualmente.

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

- App Meta configurado (`App ID`/secret como secrets AutoPainel; redirect URI da Edge Function aprovados).
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
