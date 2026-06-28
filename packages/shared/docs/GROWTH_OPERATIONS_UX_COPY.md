# Microcopy — Operações comerciais, estoque, contratos e admin (UX Writer Fase 2)

> **Fonte de verdade** para implementação nas fases UX e Frontend.  
> **Épico:** limite de estoque por plano, upgrade WhatsApp, FAB suporte, métricas aging, contratos opt-in, notificações admin.  
> **Versão:** 1.0 · junho/2026 · alinhado ao PRD PM (Fase 1)

---

## 1. Voz e tom

| Superfície | Voz | Evitar |
| --- | --- | --- |
| **dealership-panel** | Gestor de loja — claro, orientado a ação, sem culpar | «Upgrade obrigatório», jargão jurídico |
| **marketing-site** (trial + aceite) | Dono para dono, transparente | «Assinatura eletrônica», «revise com advogado» |
| **admin-master** | Operador plataforma — direto, acionável | Tom marketing, textos longos no sino |
| **Página pública opt-in contrato** | Formal mas legível | Clicksign, boleto |

### Glossário (usar sempre)

| Conceito | Termo pt-BR |
| --- | --- |
| Plano entrada | **Essencial** (até 10 veículos) |
| Plano médio | **Profissional** (11 a 30 veículos) |
| Plano topo | **Completo** (acima de 30 veículos) |
| Veículo contável | Veículo **ativo** e **disponível** no estoque |
| Upgrade | **Upgrade de plano** |
| SLA | **Resposta em até 1 dia útil** |

---

## 2. Painel da loja — limite de estoque e upgrade

### 2.1 Banner persistente (opcional — quando ≥ 80% do limite)

| Elemento | Copy |
| --- | --- |
| Título | Você está perto do limite do seu plano |
| Corpo (Essencial) | Seu plano **Essencial** inclui até **10 veículos** disponíveis no estoque. Você tem **{count}** de **10** cadastrados. |
| Corpo (Profissional) | Seu plano **Profissional** inclui até **30 veículos** disponíveis. Você tem **{count}** de **30**. |
| CTA | Solicitar upgrade |
| Link secundário | Ver meu plano |

### 2.2 Modal — bloqueio ao cadastrar veículo (limite atingido)

| Elemento | Copy |
| --- | --- |
| Título | Limite de estoque do seu plano |
| Corpo (Essencial → Profissional) | Seu plano **Essencial** permite até **10 veículos** disponíveis no estoque. Para cadastrar mais veículos, faça upgrade para o plano **Profissional** (até 30 veículos) ou **Completo** (sem limite prático para operações comerciais). |
| Corpo (Profissional → Completo) | Seu plano **Profissional** permite até **30 veículos** disponíveis. Para continuar crescendo, solicite upgrade para o plano **Completo**. |
| Destaque SLA | Nossa equipe responde solicitações de upgrade em **até 1 dia útil** pelo WhatsApp oficial. |
| Label — plano atual | Plano atual |
| Label — veículos no estoque | Veículos disponíveis hoje |
| Label — plano sugerido | Plano recomendado |
| Valor sugerido (Essencial) | Profissional — até 30 veículos |
| Valor sugerido (Profissional) | Completo — acima de 30 veículos |
| Label — mensagem (opcional) | Observações (opcional) |
| Placeholder mensagem | Ex.: Preciso cadastrar mais 5 veículos esta semana. |
| CTA primário | Enviar solicitação no WhatsApp |
| CTA secundário | Agora não |
| Nota rodapé | Você será direcionado ao WhatsApp com uma mensagem pronta. Também registramos sua solicitação para nossa equipe acompanhar. |

### 2.3 Toast / feedback pós-envio upgrade

| Situação | Copy |
| --- | --- |
| Sucesso (WhatsApp aberto) | Solicitação registrada. Continue no WhatsApp para falar com nossa equipe — respondemos em até **1 dia útil**. |
| Falha registro (WhatsApp abriu) | Abrimos o WhatsApp, mas não conseguimos registrar a solicitação. Se não receber retorno em 1 dia útil, ligue ou escreva novamente. |
| Falha total | Não foi possível abrir o WhatsApp. Verifique se há um app de mensagens instalado ou entre em contato pelo número **+55 13 99743-5851**. |

### 2.4 Erros técnicos (cadastro veículo)

| Código / causa | Copy |
| --- | --- |
| `stock_limit_reached` | Você atingiu o limite de veículos do seu plano. Solicite upgrade para cadastrar mais. |
| Erro genérico save | Não foi possível salvar o veículo. Tente novamente em instantes. |
| Sessão expirada | Sua sessão expirou. Faça login novamente para continuar. |

### 2.5 Indicador no menu Estoque (badge)

| Elemento | Copy |
| --- | --- |
| Tooltip | {count} de {limit} veículos disponíveis no seu plano |
| SR-only | Uso do plano: {count} de {limit} veículos |

---

## 3. Painel da loja — botão flutuante (FAB) WhatsApp

### 3.1 FAB

| Elemento | Copy |
| --- | --- |
| aria-label | Falar com a AutoPainel |
| Tooltip (hover) | Suporte e upgrade |

### 3.2 Sheet / dialog

| Elemento | Copy |
| --- | --- |
| Título | Falar com a AutoPainel |
| Descrição | Escolha o assunto. Nossa equipe responde em **até 1 dia útil** pelo WhatsApp oficial. |
| Opção 1 (radio) | **Suporte técnico** — problemas no painel, login, vitrine ou integrações |
| Opção 2 (radio) | **Upgrade de plano** — mais veículos, módulos ou mudança de plano |
| Opção 3 (radio) | **Outro assunto** |
| Label assunto (upgrade pré-selecionado se veio do modal estoque) | Detalhe sua solicitação |
| Placeholder (suporte) | Descreva o que aconteceu e em qual tela (ex.: não consigo publicar no OLX). |
| Placeholder (upgrade) | Ex.: Quero migrar do Essencial para o Profissional. |
| Placeholder (outro) | Como podemos ajudar? |
| SLA (rodapé) | Tempo de resposta: **até 1 dia útil** em dias úteis. |
| CTA primário | Continuar no WhatsApp |
| CTA secundário | Cancelar |

### 3.3 Estado sucesso (antes de fechar)

| Elemento | Copy |
| --- | --- |
| Título | Solicitação registrada |
| Corpo | Abrimos o WhatsApp com sua mensagem. Nossa equipe retorna em **até 1 dia útil**. |

### 3.4 Template WhatsApp (corpo da mensagem — variáveis entre `{}`)

**Upgrade de plano (estoque):**

```
Olá, equipe AutoPainel! Sou {nome_contato} da loja {nome_loja} ({slug_loja}).

Solicito UPGRADE DE PLANO.
• Plano atual: {plano_atual}
• Veículos disponíveis: {count}/{limit}
• Plano desejado: {plano_sugerido}
• Observação: {mensagem_opcional}

Aguardo retorno em até 1 dia útil. Obrigado(a)!
```

**Suporte técnico:**

```
Olá, equipe AutoPainel! Sou {nome_contato} da loja {nome_loja} ({slug_loja}).

Preciso de SUPORTE TÉCNICO.
• Assunto: {categoria}
• Descrição: {mensagem}

Aguardo retorno em até 1 dia útil. Obrigado(a)!
```

---

## 4. Painel da loja — métricas avançadas (aging / prejuízo)

> Módulo `advanced_metrics`. Tom **educativo** — «estimativa», não contabilidade fiscal.

### 4.1 Module-gated (sem módulo)

| Elemento | Copy |
| --- | --- |
| Headline | Métricas avançadas no plano Profissional ou Completo |
| Corpo | Veja quanto tempo seus veículos ficam parados, quanto capital está imobilizado e quais anúncios precisam de ação para vender mais rápido. |
| CTA | Solicitar upgrade |

### 4.2 Seção — visão geral (cards)

| Card | Título | Valor auxiliar | Tooltip |
| --- | --- | --- | --- |
| Capital imobilizado | Capital no pátio | Soma dos preços dos veículos disponíveis | Valor total de venda cadastrado nos veículos **disponíveis** hoje. |
| Dias médios | Tempo médio no estoque | Média dos veículos disponíveis | Média de dias desde que cada veículo ficou **disponível** para venda. |
| Custo estimado | Custo de permanência (estimativa) | {valor}/mês equivalente | Estimativa educativa: capital imobilizado × **0,05% ao dia**. Não substitui contabilidade. |
| Envelhecido | Estoque envelhecido | {pct}% acima de {N} dias | Veículos disponíveis há mais de **45 dias** (ajustável). |

### 4.3 Seção — «Precisa de atenção»

| Elemento | Copy |
| --- | --- |
| Título | Veículos que precisam de atenção |
| Subtítulo | Parados há muito tempo imobilizam capital e aumentam o custo de oportunidade. Priorize estes anúncios. |
| Coluna veículo | Veículo |
| Coluna dias | Dias no estoque |
| Coluna capital | Valor |
| Coluna leads | Leads (30 dias) |
| Coluna ação | Sugestão |
| Empty headline | Nenhum veículo crítico no momento |
| Empty corpo | Quando um veículo passar de **45 dias** disponível ou ficar muito acima da média da loja, ele aparecerá aqui. |
| Badge «Crítico» | Mais de 60 dias |
| Badge «Atenção» | 45–60 dias |

### 4.4 Sugestões de ação (por linha — copy fixo rotativo)

| Chave | Copy |
| --- | --- |
| `review_price` | Revisar preço — pode estar acima do mercado |
| `add_photos` | Adicionar ou atualizar fotos |
| `generate_qr` | Gerar QR Code para divulgação local |
| `republish` | Republicar nos classificados conectados |
| `highlight` | Destacar na vitrine (banner ou ordem) |

### 4.5 Tooltip fórmula «prejuízo» / custo

| Elemento | Copy |
| --- | --- |
| Título tooltip | Como calculamos |
| Corpo | Multiplicamos o valor do veículo por **0,05% por dia** de permanência. É uma **estimativa** para apoiar decisões — consulte sua contabilidade para custos reais (financiamento, pátio, depreciação). |

### 4.6 Comparativo período

| Elemento | Copy |
| --- | --- |
| Label filtro | Período |
| Opções | 7 dias · 30 dias · 90 dias |
| Delta positivo (piorou) | +{n}% vs. período anterior |
| Delta negativo (melhorou) | −{n}% vs. período anterior |

---

## 5. Marketing — trial passo «Confirmação» (contrato inline + opt-ins)

### 5.1 Cabeçalho do passo

| Elemento | Copy |
| --- | --- |
| Título card | Confirmação, contrato e aceites |
| Lead | Revise o **Termo de Adesão ao Trial** com seus dados abaixo. Para enviar a adesão, marque os três aceites obrigatórios. |

### 5.2 Bloco contrato inline (scroll)

| Elemento | Copy |
| --- | --- |
| Título bloco | Termo de Adesão ao Trial — prévia |
| Nota | Documento gerado com base nos dados que você informou. Após o envio, nossa equipe valida e libera o acesso. |
| Link alternativo | Abrir termo completo em nova aba |

### 5.3 Opt-ins obrigatórios (3 checkboxes)

| ID | Copy |
| --- | --- |
| `accept_trial_contract` | Li e aceito o **Termo de Adesão ao Trial** (versão {versão}), incluindo prazo de **30 dias**, módulos inclusos e condições de continuidade após o trial. **\*** |
| `accept_platform_terms` | Li e aceito os **Termos de Uso da plataforma AutoPainel**. **\*** |
| `accept_privacy_policy` | Li e aceito a **Política de Privacidade** da AutoPainel (versão {versão}). **\*** |

### 5.4 Opt-in opcional (manter existente)

| Copy |
| --- |
| Quero receber novidades comerciais da AutoPainel por e-mail ou WhatsApp (opcional). |

### 5.5 Validação submit

| Erro | Copy |
| --- | --- |
| Faltam aceites | Marque os três aceites obrigatórios para enviar sua adesão ao trial. |
| Sucesso imediato | Adesão enviada! Entraremos em contato em breve. |
| Fila de espera | Você entrou na fila! Avisaremos quando abrir vaga. |

---

## 6. Página pública — aceite de contrato SaaS (pós-conversão)

> Rota sugerida: `/aceite-contrato/[token]` (marketing-site ou domínio dedicado).

| Elemento | Copy |
| --- | --- |
| Título página | Aceite do contrato AutoPainel |
| Subtítulo | Olá, **{nome}**. Revise o contrato da loja **{nome_loja}** e confirme os aceites abaixo. |
| Expiração | Este link expira em **{data}**. |
| Bloco contrato | Contrato SaaS — prévia |
| Checkbox 1 | Li e aceito o **Contrato SaaS** e o Anexo I — Proposta Comercial (versão {versão}). **\*** |
| Checkbox 2 | Li e aceito os **Termos de Uso** da plataforma AutoPainel. **\*** |
| Checkbox 3 | Li e aceito a **Política de Privacidade** da AutoPainel. **\*** |
| Nota pagamento | Pagamentos da mensalidade e do setup são feitos **somente via Pix**. A nota fiscal será emitida e enviada ao e-mail do titular em até **3 dias corridos** após a confirmação do pagamento. |
| CTA | Confirmar aceites |
| Sucesso | Aceites registrados. Em breve você receberá as instruções de pagamento por e-mail. |
| Link expirado | Este link não é mais válido. Entre em contato com a AutoPainel pelo WhatsApp **+55 13 99743-5851**. |
| Já aceito | Você já confirmou este contrato em **{data}**. |

### 6.1 E-mail — convite aceite contrato

| Campo | Copy |
| --- | --- |
| Assunto | {nome_loja} — confirme seu contrato AutoPainel |
| Preview | Leia e aceite online em poucos minutos. |
| Corpo (lead) | Olá, **{nome}**! Sua loja **{nome_loja}** está pronta para ativação na AutoPainel. |
| Corpo (instrução) | Para continuar, leia o contrato e confirme os termos no link abaixo. Pagamentos via **Pix**; nota fiscal em até **3 dias** após o pagamento. |
| CTA botão | Ler contrato e aceitar |
| Rodapé | Dúvidas? WhatsApp **+55 13 99743-5851** — respondemos em até **1 dia útil**. |

---

## 7. Admin Master — contratos (sem assinatura eletrônica)

### 7.1 Lista `/painel/contratos`

| Elemento | Copy (substituir legado) |
| --- | --- |
| Descrição página | Rascunho → envio para aceite → aceite confirmado. Texto congelado após o envio. |
| Status `draft` | Rascunho |
| Status `sent_for_acceptance` | Aguardando aceite |
| Status `accepted` | Aceite confirmado |
| Status `declined` | Aceite recusado |
| Status `expired` | Link expirado |
| KPI «Aguardando aceite» | Aguardando aceite do cliente |
| Remover | «Revisão jurídica», «Clicksign», «assinatura eletrônica» |

### 7.2 Formulário novo contrato

| Elemento | Copy |
| --- | --- |
| Descrição | Gera rascunho com Anexo I preenchido. Após revisão interna, envie o link de aceite ao titular. |
| Label notas internas | Notas internas (opcional) |
| Placeholder notas | Ex.: Desconto de setup acordado por WhatsApp. |
| CTA enviar | Enviar link de aceite |
| Toast enviado | Link de aceite enviado para **{email}**. |

### 7.3 Ações detalhe contrato

| Ação | Copy |
| --- | --- |
| Marcar aceito manualmente | Registrar aceite manual |
| Modal corpo | Use apenas se o cliente aceitou por canal offline e você tem evidência documentada. |
| Referência | ID ou referência do aceite (opcional) |

### 7.4 Cláusulas novas (resumo UI admin — texto completo na migração)

| Tema | Frase para operador (tooltip Anexo) |
| --- | --- |
| Pagamento | Mensalidade e setup: **somente Pix**. |
| NF | NF enviada ao e-mail do titular em até **3 dias corridos** após confirmação do pagamento. |
| Faixa estoque | Essencial até 10 · Profissional 11–30 · Completo acima de 30 veículos disponíveis. |

---

## 8. Admin Master — central de notificações

### 8.1 Header

| Elemento | Copy |
| --- | --- |
| aria-label sino | Notificações |
| Badge SR | {n} notificações não lidas |
| Link ver todas | Ver todas |

### 8.2 Tipos de notificação (título + corpo)

| Tipo | Título | Corpo |
| --- | --- | --- |
| `commercial_lead_new` | Novo lead comercial | **{nome}** ({email}) — origem: {canal}. |
| `trial_onboarding_new` | Nova adesão trial | Loja **{nome_loja}** — {imediato\|fila}. |
| `plan_upgrade_request` | Pedido de upgrade | **{nome_loja}** — {plano_atual} → {plano_desejado}. **Responder em 1 dia útil.** |
| `support_request` | Suporte técnico (painel loja) | **{nome_loja}** — {resumo}. **Responder em 1 dia útil.** |
| `contract_sent` | Contrato enviado | **{nome_loja}** — aguardando aceite de **{email}**. |
| `contract_accepted` | Contrato aceito | **{nome_loja}** — aceite confirmado em **{data}**. |
| `contract_declined` | Aceite recusado | **{nome_loja}** — titular recusou o contrato. |
| `cancellation_request` | Pedido de cancelamento | **{nome_loja}** solicitou cancelamento. |
| `billing_due_7` | Mensalidade em 7 dias | **{nome_loja}** — vencimento em **{data}**. |
| `billing_due_3` | Mensalidade em 3 dias | **{nome_loja}** — vencimento em **{data}**. |
| `billing_due_today` | Mensalidade vence hoje | **{nome_loja}** — cobrar hoje. |
| `billing_overdue` | Mensalidade em atraso | **{nome_loja}** — **{n} dias** de atraso. |

### 8.3 Página `/painel/notificacoes`

| Elemento | Copy |
| --- | --- |
| Título | Notificações |
| Subtítulo | Eventos comerciais, contratos, upgrades e cobrança. |
| Filtro todos | Todas |
| Filtro não lidas | Não lidas |
| Filtro upgrade | Upgrades e suporte |
| Filtro billing | Cobrança |
| Marcar lida | Marcar como lida |
| Marcar todas | Marcar todas como lidas |
| Empty | Nenhuma notificação no momento. |
| SLA badge atrasado | Resposta em atraso |

### 8.4 Atalhos contato (bloco em ficha loja / lead / contrato)

| Botão | Copy | aria-label |
| --- | --- | --- |
| E-mail | E-mail | Enviar e-mail para {email} |
| WhatsApp | WhatsApp | Abrir WhatsApp de {nome} |
| Copiar e-mail | Copiar e-mail | Copiar endereço de e-mail |
| Copiar telefone | Copiar telefone | Copiar número de WhatsApp |

---

## 9. Admin Master — fila solicitações upgrade

| Elemento | Copy |
| --- | --- |
| Menu | Solicitações de upgrade |
| Título | Upgrade e suporte (painéis das lojas) |
| Coluna loja | Loja |
| Coluna tipo | Tipo |
| Coluna planos | Plano atual → desejado |
| Coluna SLA | Prazo resposta |
| Coluna status | Status |
| Status `open` | Aguardando resposta |
| Status `in_progress` | Em atendimento |
| Status `done` | Concluído |
| Ação | Marcar como respondido |
| SLA ok | Dentro do prazo (1 dia útil) |
| SLA late | Atrasado — responder urgente |

---

## 10. Erros transversais

| Contexto | Copy operador admin | Copy gestor loja |
| --- | --- | --- |
| 403 | Você não tem permissão para esta ação. | Você não tem permissão para esta ação. |
| 404 registro | Registro não encontrado. | Não encontramos este item. |
| 500 | Erro interno. Tente novamente ou contate o suporte técnico. | Algo deu errado. Tente novamente em instantes. |
| Sem rede | Sem conexão. Verifique sua internet. | idem |

---

## 11. Checklist UX Writer

- [x] pt-BR natural; sem pt-PT
- [x] Planos Essencial / Profissional / Completo consistentes
- [x] SLA «1 dia útil» em upgrade, suporte e rodapés
- [x] Sem «revise com advogado» / Clicksign
- [x] Pix-only e NF 3 dias no aceite contrato
- [x] Métricas com linguagem «estimativa»
- [x] Placeholders `{variável}` para whitelabel tenant

---

**Handoff:** Copy pronto. UX pode montar inventário de telas e estados (Fase 3).
