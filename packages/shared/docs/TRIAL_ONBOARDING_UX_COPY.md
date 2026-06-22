# Microcopy — Campanha Trial Essencial (UX Writer Fase 2)

> **Fonte de verdade** para implementação nas fases UX e Frontend.  
> **Persona principal:** dono(a)/gestor(a) de concessionária (B2B, pt-BR).  
> **Versão:** 1.0 · junho/2026 · alinhado a `BZ-TR-001…006`

---

## 1. Voz e tom

| Superfície | Voz | Evitar |
| --- | --- | --- |
| **marketing-site** (`/adesao-trial`, `/planos`) | Dono para dono — direto, confiante, sem corporativês | «Solução disruptiva», «synergy», jargão SaaS |
| **admin-master** (adesões, conversão) | Técnico-operacional, preciso | Tom marketing exagerado |
| **customer-site** (legal vitrine) | Transparente, LGPD clara | Juridiquês sem explicação |

---

## 2. `/planos` — comparativo e cards

### 2.1 Blocos gerais

| Elemento | Copy (pt-BR) |
| --- | --- |
| Nota catálogo DB | Comparativo atualizado conforme catálogo comercial da plataforma. |
| Título «Como escolhemos» | Como escolhemos o plano ideal |
| Corpo faixa estoque | O tier recomendado considera principalmente o **volume de veículos ativos no estoque** da sua concessionária. Lojas menores começam no Essencial; operações com mais pátio e integrações digitais evoluem para Profissional ou Completo. Na proposta comercial confirmamos a faixa exata com base no seu estoque atual e metas de crescimento. |
| Setup | **Setup único (obrigatório):** {setupLabel} — onboarding assistido, configuração da vitrine e importação inicial do estoque. Cobrado uma vez na contratação; não entra na mensalidade. |
| Título «Sempre incluído» | Sempre incluído em todos os planos |
| Itens base (lista) | Vitrine whitelabel com domínio da loja · Gestão de estoque e fotos · Captação e organização de leads · Tema, logo e identidade visual · Equipe com papéis (gestor, vendedor) |
| Cabeçalho tabela | Módulo |
| SR incluído | Incluído |
| SR não incluído | Não incluído |
| Badge módulo | **Em breve** |
| Tooltip badge (title) | Integração em homologação — disponível em breve no plano Completo. |

### 2.2 Cards por plano

| Elemento | Essencial | Profissional | Completo |
| --- | --- | --- | --- |
| Faixa estoque (sub) | {stockBandLabel} em estoque | idem | idem |
| Setup linha | Setup: {setupLabel} (único, obrigatório) | idem | idem |
| CTA primário | **Começar trial grátis** | Falar com vendas | Falar com vendas |

### 2.3 Módulos — rótulos e descrições (tabela)

| Módulo | Descrição curta (linha auxiliar) |
| --- | --- |
| Simulador de financiamento | Simulação na vitrine e ferramentas no painel. |
| QR Code por veículo | QR vinculado ao anúncio para divulgação física e digital. |
| Integração OLX | Publicação e baixa de anúncios via OAuth. |
| Integração WebMotors | Sincronização com portal WebMotors (Sensedia). |
| Integração iCarros | Publicação no portal iCarros quando homologado. **+ badge Em breve** |
| Kit redes sociais (Meta) | Carrosséis e publicação Facebook/Instagram. **+ badge Em breve** |
| Métricas avançadas | Indicadores extras no painel da loja. |
| Recibo de compra/venda | Emissão de recibo com dados da loja. |

### 2.4 Module-gated (marketing — expectativa)

| Contexto | Headline | Corpo | CTA |
| --- | --- | --- | --- |
| iCarros / Meta no comparativo | — (só badge) | — | — |
| Lead pergunta integração no trial | Integração ainda não disponível no trial | OLX, WebMotors e portais adicionais fazem parte do plano Completo. No trial Essencial você já tem vitrine, estoque, simulador, QR Code e métricas. | Ver plano Completo |
| Recibo no Essencial | Disponível no plano Profissional | Emita recibo de compra e venda direto no painel, com dados da loja. | Falar com vendas |

---

## 3. `/adesao-trial` — página e wizard

### 3.1 Hero da página

| Elemento | Copy (pt-BR) |
| --- | --- |
| Eyebrow | Campanha · Plano Essencial |
| H1 | Trial grátis por 30 dias |
| Lead | Preencha uma vez: dados da loja, identidade visual e textos da vitrine. Nossa equipe monta sua loja com **Simulador de financiamento**, **QR Code** e **Métricas avançadas** inclusos — sem mensalidade no período de teste. |
| Meta description (SEO) | Trial de 30 dias no plano Essencial da AutoPainel — vitrine, estoque, simulador, QR Code e métricas. |

### 3.2 Stepper (passos)

| # | Label curto | Subtítulo (opcional sob stepper) |
| --- | --- | --- |
| 1 | Dados da loja | CNPJ, contato e endereço de cobrança |
| 2 | Identidade visual | Cores, logos e tipografia |
| 3 | Vitrine | Tema, layout e textos da homepage |
| 4 | Institucional | Sobre a loja, redes e unidades |
| 5 | Confirmação | Termos e envio |

| Elemento | Copy |
| --- | --- |
| Botão Voltar | Voltar |
| Botão Continuar | Continuar |
| Botão enviar | Enviar adesão ao trial |
| Loading envio | Enviando… |
| aria-busy form | Enviando formulário de adesão |

---

### 3.3 Passo 1 — Dados da loja

| Elemento | Label | Placeholder | Texto de ajuda |
| --- | --- | --- | --- |
| Seção | Dados gerais da concessionária | — | — |
| Nome comercial | Nome comercial da loja | Ex.: Auto Center Sul | Como aparece na vitrine, no painel e nos documentos comerciais. |
| CNPJ | CNPJ | 00.000.000/0001-00 | 14 dígitos. Usado no contrato, faturamento e notas. |
| Slug | Subdomínio desejado | minhaloja | Sua vitrine ficará em **minhaloja.autopainel.com.br**. Use só letras minúsculas, números e hífens. |
| Checkbox domínio | Quero domínio personalizado | — | Ex.: www.minhaloja.com.br — configuramos após aprovação comercial. |
| Domínio custom | Domínio personalizado | www.minhaloja.com.br | Informe sem `https://`. Nossa equipe orienta o apontamento DNS. |
| E-mail | E-mail de contato comercial | contato@sualoja.com.br | Principal canal da equipe AutoPainel com sua loja. |
| WhatsApp | WhatsApp comercial | (13) 99999-9999 | Com DDD. Aparece nos botões de contato da vitrine. |
| Representante | Nome do representante legal | Nome completo | Quem assina pelo CNPJ informado. |
| CPF | CPF do representante legal | 000.000.000-00 | 11 dígitos. |
| Endereço cobrança | Endereço de cobrança | Rua, número, bairro, cidade, UF, CEP | Endereço para boletos e documentos fiscais da assinatura. |

---

### 3.4 Passo 2 — Identidade visual

| Elemento | Label | Texto de ajuda |
| --- | --- | --- |
| Seção | Identidade visual da vitrine | Suas cores e logos personalizam o site whitelabel. Campos vazios usam padrões da plataforma. |
| Cor primária | Cor primária | Hexadecimal com `#`, ex.: `#0f172a`. Botões, links e destaques principais. |
| Cor texto primária | Cor do texto sobre a primária | Contraste legível sobre a cor primária, ex.: `#f8fafc`. |
| Cor secundária | Cor secundária (destaques) | CTAs secundários, faixas e detalhes visuais. |
| Logo escuro | Logo para fundo escuro | PNG, JPG, WebP ou GIF · até 2 MB. Cabeçalho quando o tema da vitrine for escuro. |
| Logo claro | Logo para fundo claro | PNG, JPG, WebP ou GIF · até 2 MB. Vitrine clara, painel da loja e materiais impressos (QR). |
| Logo rodapé | Logo do rodapé | Versão horizontal ou compacta · até 2 MB. |
| Favicon | Favicon | Quadrado 32×32 ou 64×64 px · até 2 MB. Ícone da aba do navegador. |
| Fonte títulos | Fonte dos títulos | Nome exato da Google Font gratuita, ex.: Montserrat. |
| Fonte corpo | Fonte do corpo de texto | Nome exato da Google Font, ex.: Inter. |

---

### 3.5 Passo 3 — Vitrine e homepage

| Elemento | Label | Texto de ajuda |
| --- | --- | --- |
| Seção | Aparência e homepage | Escolha o visual do site. Os textos abaixo valem para o **layout selecionado**; você pode repetir variações por layout na etapa de revisão com nossa equipe. |
| Tema | Tema da vitrine | **Claro** — fundo claro, leitura diurna. **Escuro** — fundo escuro, visual premium. |
| Layout | Modelo de layout | **Layout 1 — Clássico:** hero amplo + card lateral. **Layout 2 — Editorial:** faixa de confiança + história em destaque. **Layout 3 — Compacto:** vitrine com destaques em grade. |
| Hero imagem | Imagem do banner principal | **1920×800 px** recomendado · JPG, PNG ou WebP · até 5 MB. Foto do pátio, fachada ou lifestyle automotivo. Evite logos com muito texto. |
| Eyebrow | Destaque acima do título | Frase curta acima do título principal — ex.: «Há 20 anos no mercado». |
| H1 | Título principal (H1) | Headline do banner. Use `{nome_loja}` onde quiser inserir o nome automaticamente. |
| Subtítulo | Subtítulo do banner | 1–2 frases com sua proposta de valor — estoque selecionado, financiamento, atendimento. |
| CTA estoque | Texto do botão — Ver estoque | Label do botão principal do banner. Ex.: «Ver estoque completo». |
| CTA WhatsApp | Texto do botão — WhatsApp | Ex.: «Falar no WhatsApp». |
| Link explorar | Texto do link secundário | Ex.: «Explorar veículos». Aparece abaixo ou ao lado dos botões. |
| Card lateral título | Título do card lateral *(layout 1)* | Ex.: «Por que comprar conosco?» |
| Card lateral itens | Item do card 1 / 2 / 3 *(layout 1)* | Bullets curtos — garantia, revisão, troca facilitada. |
| Faixa confiança | Indicador 1–4 *(valor + rótulo)* | Ex.: valor «15+», rótulo «Anos de mercado». Aparece na faixa abaixo do banner. |
| História eyebrow | Destaque «Nossa história» | Ex.: «Tradição e confiança». |
| História título | Título da seção Nossa história | Ex.: «Mais que uma loja, uma parceira na sua compra». |
| História corpo | Texto institucional da homepage | Parágrafo sobre história e diferenciais. Se vazio, usamos o campo «Sobre a loja» do passo 4. |
| História stats | Indicador institucional 1–3 | Números de credibilidade — veículos vendidos, clientes, anos. |
| Financiamento título | Título do bloco de financiamento | Ex.: «Simule seu financiamento». |
| Financiamento subtítulo | Subtítulo do financiamento | Ex.: «Parcelas estimadas em segundos, sem compromisso». |
| Financiamento CTA | Botão do simulador | Ex.: «Simular agora». |

**Nota UX:** bloco `{nome_loja}` = placeholder `{nome_loja}` no código (`STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME`).

---

### 3.6 Passo 4 — Institucional e unidades

| Elemento | Label | Texto de ajuda |
| --- | --- | --- |
| Seção | Conteúdo institucional e unidades | — |
| Sobre | Sobre a loja (página institucional) | História completa, missão e tom da marca. Aparece na página «Sobre» e complementa textos vazios da homepage. |
| Instagram | Instagram | URL ou @usuario — ex.: instagram.com/sualoja |
| Facebook | Facebook | URL da página — ex.: facebook.com/sualoja |
| Site atual | Site atual (se houver) | URL do site antigo, se existir. |
| Unidades intro | Unidades e filiais | Cadastre matriz e filiais. Cada unidade pode ter WhatsApp e endereço próprios na vitrine. |
| Unidade nome | Nome da unidade {n} | Ex.: Matriz Centro, Filial Norte |
| Unidade WhatsApp | WhatsApp da unidade | Com DDD — contato específico desta unidade. |
| Unidade endereço | Endereço da unidade | Rua, número, bairro, cidade, UF, CEP |
| Unidade matriz | Esta é a unidade principal | Marque uma unidade como matriz. |
| Botão add | Adicionar unidade | — |
| Botão remover | Remover unidade | — |

**Empty state unidades (zero cadastradas):**  
- Headline: «Só uma unidade?»  
- Corpo: «Se você opera em um único endereço, pode pular esta etapa. Nossa equipe usa o endereço de cobrança como referência.»

---

### 3.7 Passo 5 — Confirmação e LGPD

| Elemento | Copy |
| --- | --- |
| Seção | Confirmação e termos |
| Resumo plano | **Plano Essencial** · trial gratuito por **30 dias** · Simulador de financiamento, QR Code por veículo e Métricas avançadas inclusos. Após o trial, a continuidade exige contratação do plano pago. |
| Checkbox trial | Li e aceito o [Termo de Adesão ao Trial](/termo-adesao-trial) (versão {versão}), incluindo autorização para a AutoPainel tratar e ** deter** os dados pessoais de clientes e leads captados na vitrine, na qualidade de operadora e detentora conforme a LGPD. |
| Checkbox privacidade | Aceito a [Política de Privacidade](/politica-de-privacidade) da AutoPainel. |
| Checkbox detentora *(obrigatório)* | Autorizo expressamente que a AutoPainel, na condição de operadora/detentora, processe e armazene dados de consumidores e leads gerados no site da minha loja — inclusive para backup, CRM, analytics contratados e cumprimento do contrato — conforme instruções da minha concessionária como controladora. |
| Checkbox marketing *(opcional)* | Quero receber novidades comerciais da AutoPainel (opcional). |

---

### 3.8 Tela de sucesso (pós-envio)

| Elemento | Copy |
| --- | --- |
| Headline | Adesão recebida! |
| Corpo | Recebemos seus dados. Nossa equipe revisa o cadastro e entra em contato em **até 1 dia útil** para ativar seu trial de 30 dias no plano Essencial. |
| Protocolo | Protocolo: {intakeId} |
| CTA secundário | Ver planos |
| CTA WhatsApp *(opcional futuro)* | Falar no WhatsApp agora |

---

## 4. `/termo-adesao-trial`

| Elemento | Copy |
| --- | --- |
| Aviso OAB | **Aviso:** modelo operacional — revisão por advogado(a) OAB antes de uso oficial. |
| Link voltar | ← Voltar ao formulário de adesão |
| Título página | Termo de Adesão ao Trial — Plano Essencial AutoPainel |

*(Corpo legal: ver `TERMO_ADESAO_TRIAL_PLATAFORMA.md` — linguagem jurídica, não alterar sem OAB.)*

---

## 5. admin-master — Adesões e conversão

### 5.1 `/painel/adesoes-trial`

| Elemento | Copy |
| --- | --- |
| Título | Adesões trial |
| Subtítulo | Formulários enviados pelo site — vincule ao lead comercial e converta em concessionária. |
| Coluna loja | Loja |
| Coluna e-mail | E-mail |
| Coluna slug | Subdomínio |
| Coluna status | Status |
| Coluna data | Recebido |
| Coluna ação | Ação |
| Status `submitted` | Recebido |
| Status `linked` | Vinculado ao lead |
| Status `converted` | Convertido |
| Status `archived` | Arquivado |
| Botão converter | Converter em loja |
| Botão ver loja | Ver loja |
| **Empty state** headline | Nenhuma adesão trial ainda |
| **Empty state** corpo | Quando lojistas enviarem o formulário em autopainel.com.br/adesao-trial, os cadastros aparecem aqui. |
| **Empty state** CTA | Ver leads comerciais |

### 5.2 Banner prefill `/painel/concessionarias/nova?intake=`

| Elemento | Copy |
| --- | --- |
| Título banner | Dados pré-preenchidos da adesão trial |
| Corpo | Revise identidade visual, textos da vitrine e plano **Essencial** antes de publicar. Intake: `{uuid}` |
| Alerta slug ocupado | Este subdomínio já está em uso. Ajuste o slug antes de salvar. |
| Alerta CNPJ duplicado | Este CNPJ já está cadastrado. Verifique se a loja já existe. |

### 5.3 Toasts (admin — pós-conversão)

| Evento | Toast sucesso | Toast erro |
| --- | --- | --- |
| Loja criada a partir de intake | Concessionária criada. Provisionamento de domínio em andamento. | Não foi possível criar a loja. Confira slug, CNPJ e domínio. |
| Intake vinculado a lead | Adesão vinculada ao lead comercial. | Não foi possível vincular. Tente novamente. |
| Intake arquivado | Adesão arquivada. | — |

### 5.4 Leads comerciais — origem trial

| Elemento | Copy |
| --- | --- |
| Badge origem | Trial — formulário |
| Mensagem pipeline | Formulário de adesão trial — intake {id} |
| Estágio inicial | Onboarding |

---

## 6. customer-site — Legal vitrine (revisão jun/2026)

| Elemento | Copy chave |
| --- | --- |
| Privacidade § controladora | O controlador dos dados coletados neste site é **{nome_loja}**, operadora da vitrine digital. |
| Privacidade § operadora/detentora | A plataforma é fornecida pela AutoPainel, que atua como **operadora e detentora** do tratamento de dados processados na infraestrutura da vitrine (incluindo leads, simulações e registros técnicos), conforme instruções e contrato com a concessionária, que permanece **controladora** perante os titulares. |
| Privacidade § compartilhamento | … A infraestrutura da vitrine é operada pela AutoPainel, que **detém e processa** os registros na condição de operadora contratada pela loja. |
| Termos § privacidade | … Ao utilizar formulários deste site, você declara ciência de que {nome_loja} é controladora e a plataforma AutoPainel pode deter e processar seus dados como operadora contratada. |

---

## 7. Mensagens de erro (técnico → usuário)

### 7.1 Formulário `/adesao-trial` (lojista)

| Código / origem | Copy exibida |
| --- | --- |
| `trial_accepted` false | Aceite o Termo de Adesão ao Trial para continuar. |
| `privacy_accepted` false | Aceite a Política de Privacidade da AutoPainel. |
| `data_processing_accepted` false | É necessário autorizar o tratamento e a detenção dos dados de clientes e leads pela AutoPainel. |
| `store_name` vazio | Informe o nome da loja. |
| slug inválido | Informe um subdomínio válido (letras minúsculas, números e hífens). |
| e-mail inválido | Informe um e-mail de contato válido. |
| cor hex inválida | Cor primária inválida. Use o formato #RRGGBB. |
| config servidor | Configuração temporariamente indisponível. Tente novamente em alguns minutos. |
| RPC falha genérica | Não foi possível registrar sua adesão agora. Verifique os dados ou tente novamente em instantes. |
| arquivo grande | O arquivo «{nome amigável}» passou do tamanho máximo. Reduza a imagem ou escolha outro formato. |
| formato inválido | Formato não aceito em «{nome amigável}». Use JPG, PNG ou WebP. |
| upload indisponível | Não foi possível enviar a imagem agora. Tente novamente ou envie só os dados textuais — nossa equipe solicita os arquivos depois. |
| falha storage | Não foi possível enviar «{nome amigável}». Tente outro arquivo ou formato. |

**Nomes amigáveis upload:** logo escuro · logo claro · logo do rodapé · favicon · banner principal

### 7.2 Validação client-side (fase UX — antes do submit)

| Campo | Copy |
| --- | --- |
| CNPJ incompleto | Informe os 14 dígitos do CNPJ. |
| CPF incompleto | Informe os 11 dígitos do CPF do representante. |
| WhatsApp curto | Informe o WhatsApp com DDD. |
| Passo incompleto | Preencha os campos obrigatórios desta etapa antes de continuar. |

### 7.3 Admin (operador plataforma)

| Técnico | Copy operador |
| --- | --- |
| 23505 slug | Este subdomínio já está em uso. Escolha outro slug. |
| 23505 cnpj | Este CNPJ já está cadastrado em outra concessionária. |
| intake_not_found | Adesão não encontrada ou já arquivada. |
| forbidden | Você não tem permissão para esta ação. |

---

## 8. Glossário — campanha trial

| Termo | Definição (uso na UI) |
| --- | --- |
| **Trial** | Período gratuito de 30 dias no plano Essencial |
| **Essencial** | Plano de entrada — até ~10 veículos ativos (faixa confirmada comercialmente) |
| **Adesão** | Envio do formulário público de onboarding (não confundir com «assinatura paga») |
| **Intake** | Registro interno da adesão (`dealership_onboarding_intakes`) — mostrar ao operador como «Protocolo» ou «ID da adesão» |
| **Subdomínio / slug** | Primeira parte da URL — `minhaloja.autopainel.com.br` |
| **Whitelabel** | Site com marca, cores e logos da loja |
| **Controladora** | A concessionária perante o consumidor (LGPD) |
| **Operadora / detentora** | AutoPainel na infraestrutura que hospeda leads e dados da vitrine |
| **Em breve** | Módulo anunciado no Completo, ainda não liberado para contratação |
| **Converter em loja** | Ação do admin que cria a concessionária a partir do intake |

---

## 9. Handoff UX (Fase 3)

Copy aprovado para inventário de telas. Prioridades UX:

1. Preview visual dos 3 layouts no passo 3  
2. Máscaras CNPJ/CPF/CEP/WhatsApp com microcopy de erro client-side  
3. Campos completos de homepage (CTAs, trust stats, card lateral layout 1) conforme §3.5  
4. Endereço de unidade estruturado (não textarea único no passo 1)  
5. Indicador de progresso «Etapa 2 de 5» acessível  

---

*Próxima fase: UX Agent — jornadas, wireframes e estados (loading/empty/error/success) usando este documento.*
