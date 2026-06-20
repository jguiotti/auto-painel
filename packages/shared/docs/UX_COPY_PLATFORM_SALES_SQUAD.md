# UX Copy — Equipe comercial AutoPainel (Fase 2)

> **Status:** Aprovado para handoff UX (Fase 3).  
> **Audiência:** Operadores admin (`super_admin`), financeiro, representantes comerciais internos.  
> **Idioma:** pt-BR (Brasil). Identificadores técnicos em inglês no código.  
> **PRD:** [`PRD_PLATFORM_SALES_SQUAD.md`](./PRD_PLATFORM_SALES_SQUAD.md)

---

## Glossário (usar sempre estes termos)

| Conceito | Termo na UI | Evitar |
| --- | --- | --- |
| Representante comercial interno | **Representante comercial** | Vendedor (ambíguo com seller da loja), Rep |
| Carteira de lojas do rep | **Carteira** | Portfólio (ok em docs internos, na UI preferir carteira) |
| Transferência de carteira | **Repasse de carteira** | Handoff, migração |
| Comissão recorrente mensal | **Comissão recorrente** | MRR comission |
| Estorno por cancelamento | **Estorno** | Clawback, chargeback |
| Lote de pagamento | **Lote de pagamento** | Batch, remessa |
| Competência | **Competência** (mês/ano) | Período contábil |
| Atribuição rep ↔ loja | **Vínculo comercial** | Attribution |
| Operador admin técnico | **Operador da plataforma** | Admin, super admin na UI |
| Chave PIX | **Chave PIX** | Pix key |

---

## 1. Menu e navegação

| Elemento | Copy |
| --- | --- |
| Item menu (admin) | Equipe comercial |
| Subtítulo breadcrumb | Comissões, carteira e pagamentos |
| Tab / segmento — Operadores | Operadores da plataforma |
| Tab / segmento — Comercial | Representantes comerciais |
| Link cruzado | Usuários das lojas → `/painel/usuarios` |
| Link portal rep (futuro) | Meu extrato |

---

## 2. Lista de representantes comerciais

**Rota:** `/painel/equipe/comercial` (ou aba em `/painel/equipe`)

| Elemento | Copy |
| --- | --- |
| Título da página | Representantes comerciais |
| Subtítulo | Cadastre a equipe de vendas, acompanhe carteiras, comissões e pagamentos. |
| Botão primário | Novo representante |
| Placeholder busca | Buscar por nome ou e-mail… |
| Filtro status — todos | Todos os status |
| Filtro status — active | Ativos |
| Filtro status — onboarding | Em integração |
| Filtro status — inactive | Inativos |
| Coluna nome | Nome |
| Coluna e-mail | E-mail |
| Coluna carteira | Lojas na carteira |
| Coluna comissão | Comissão padrão |
| Coluna próximo pagamento | Próximo pagamento |
| Coluna status | Status |
| Badge onboarding | Em integração |
| Badge active | Ativo |
| Badge inactive | Inativo |
| Ação linha — editar | Editar cadastro |
| Ação linha — extrato | Ver extrato |
| Ação linha — repasse | Repassar carteira |
| Empty headline | Nenhum representante cadastrado |
| Empty descrição | Adicione representantes comerciais para vincular lojas fechadas e calcular comissões recorrentes. |
| Empty CTA | Cadastrar primeiro representante |
| Loading | Carregando representantes… |

---

## 3. Cadastro / edição de representante

| Elemento | Copy |
| --- | --- |
| Título criar | Novo representante comercial |
| Título editar | Editar representante |
| Seção — Dados pessoais | Dados pessoais |
| Label nome | Nome completo |
| Placeholder nome | Ex.: Ana Silva |
| Label e-mail | E-mail |
| Placeholder e-mail | nome@autopainel.com.br |
| Label telefone | Telefone (WhatsApp) |
| Placeholder telefone | (11) 98765-4321 |
| Label CPF | CPF |
| Helper CPF | Usado apenas para pagamentos. Acesso restrito ao financeiro. |
| Seção — Contrato comercial | Contrato comercial |
| Label data admissão | Data de admissão |
| Label comissão padrão | Comissão recorrente padrão (%) |
| Helper comissão | Percentual sobre a mensalidade enquanto a loja permanecer ativa na carteira deste representante. |
| Label status | Status |
| Opção onboarding | Em integração |
| Opção active | Ativo |
| Opção inactive | Inativo |
| Seção — Observações | Observações internas |
| Placeholder notas | Anotações visíveis só para operadores e financeiro. |
| Botão salvar | Salvar representante |
| Botão cancelar | Cancelar |
| Toast sucesso criar | Representante cadastrado. |
| Toast sucesso editar | Dados atualizados. |
| Toast erro genérico | Não foi possível salvar. Verifique os campos e tente novamente. |

### Validações (formulário)

| Erro técnico | Copy |
| --- | --- |
| E-mail duplicado | Já existe um representante com este e-mail. |
| CPF inválido | Informe um CPF válido. |
| Comissão fora do intervalo | A comissão deve estar entre 0% e 100%. |
| Nome obrigatório | Informe o nome completo. |

---

## 4. Dados bancários (PIX / TED)

**Contexto:** subpágina ou drawer no cadastro do representante.

| Elemento | Copy |
| --- | --- |
| Título | Dados para pagamento |
| Subtítulo | Informações usadas nos lotes de pagamento. Dados sensíveis ficam mascarados na listagem. |
| Label método | Forma de pagamento |
| Opção pix | PIX |
| Opção ted | Transferência (TED) |
| Label tipo chave PIX | Tipo de chave PIX |
| Opções tipo | CPF · E-mail · Telefone · Chave aleatória |
| Label chave PIX | Chave PIX |
| Helper chave | Exibimos apenas os últimos 4 caracteres após salvar. |
| Label titular | Nome do titular |
| Label documento titular | CPF/CNPJ do titular |
| Label banco (TED) | Banco |
| Label agência | Agência |
| Label conta | Conta com dígito |
| Botão salvar | Salvar dados bancários |
| Toast sucesso | Dados bancários salvos. |
| Toast erro | Não foi possível salvar os dados bancários. |
| Empty | Nenhuma forma de pagamento cadastrada. |
| Empty CTA | Cadastrar PIX |
| Banner segurança | Somente operadores autorizados visualizam dados completos. |

---

## 5. Vínculo comercial (rep ↔ loja fechada)

**Onde:** wizard a partir de lead comercial, contrato ou ficha da concessionária.

| Elemento | Copy |
| --- | --- |
| Título | Vincular loja ao representante |
| Subtítulo | Define quem recebe comissão recorrente sobre esta loja. |
| Label loja | Concessionária |
| Label representante | Representante comercial |
| Label papel | Papel no fechamento |
| Opção closer | Fechamento (closer) |
| Opção sdr | Prospecção (SDR) |
| Opção referral | Indicação |
| Label participação | Participação na comissão (%) |
| Helper split | Se mais de um representante participou, a soma das participações não pode passar de 100%. |
| Label data fechamento | Data do fechamento |
| Botão confirmar | Confirmar vínculo |
| Toast sucesso | Loja vinculada à carteira do representante. |
| Toast erro split | A soma das participações desta loja ultrapassa 100%. Ajuste os percentuais. |
| Status pending | Aguardando confirmação |
| Status confirmed | Confirmado |
| Status disputed | Em disputa |
| Status cancelled | Cancelado |

---

## 6. Repasse de carteira (rep sai da empresa)

| Elemento | Copy |
| --- | --- |
| Título modal | Repassar carteira |
| Corpo modal | As lojas selecionadas passarão a gerar comissão recorrente para **{{nome_novo_rep}}** a partir de **{{data_repasse}}**. **{{nome_rep_anterior}}** deixa de receber novas comissões dessas lojas. Lançamentos já pagos não são alterados. |
| Label rep origem | Representante que está saindo |
| Label rep destino | Novo responsável pela carteira |
| Label data repasse | Data de início do repasse |
| Helper data | Comissões com competência a partir desta data vão para o novo representante. |
| Label lojas | Lojas a repassar |
| Opção todas | Todas as lojas ativas na carteira |
| Opção selecionar | Selecionar lojas |
| Botão confirmar | Confirmar repasse |
| Botão cancelar | Cancelar |
| Toast sucesso | Carteira repassada. {{n}} loja(s) atualizada(s). |
| Toast erro sem destino | Selecione o representante que assumirá a carteira. |
| Toast erro rep inativo | O representante destino precisa estar ativo. |
| Confirmação irreversível (checkbox) | Entendo que comissões futuras destas lojas serão do novo representante. |

---

## 7. Extrato e comissões (visão admin)

**Rota:** `/painel/equipe/comercial/[id]/extrato`

| Elemento | Copy |
| --- | --- |
| Título | Extrato — {{nome_rep}} |
| Subtítulo | Comissões recorrentes, bônus e estornos por competência. |
| Filtro competência | Competência |
| Filtro tipo | Tipo de lançamento |
| Tipo commission | Comissão recorrente |
| Tipo bonus | Bônus de campanha |
| Tipo adjustment | Ajuste manual |
| Tipo clawback | Estorno |
| Coluna data | Data |
| Coluna competência | Competência |
| Coluna loja | Loja |
| Coluna descrição | Descrição |
| Coluna valor | Valor |
| Coluna status | Status |
| Status pending | Pendente |
| Status approved | Aprovado |
| Status paid | Pago |
| Status cancelled | Cancelado |
| Total pendente | Total pendente |
| Total aprovado | Total aprovado |
| Total pago | Total pago (acumulado) |
| Botão aprovar selecionados | Aprovar selecionados |
| Botão exportar | Exportar CSV |
| Empty | Nenhum lançamento neste período. |
| Toast aprovação | {{n}} lançamento(s) aprovado(s). |

### Descrições automáticas (ledger)

| Situação | Texto gerado |
| --- | --- |
| Comissão mensal | Comissão recorrente — {{nome_loja}} — {{mes_competencia}} |
| Bônus campanha | Bônus — {{nome_campanha}} |
| Estorno churn 30d | Estorno — cancelamento em 30 dias — {{nome_loja}} |
| Ajuste manual | Ajuste — {{motivo}} |

---

## 8. Portal do representante — Meu extrato (v1)

**Rota:** `/painel/comercial/extrato` (login próprio do rep, **não** `super_admin`)

| Elemento | Copy |
| --- | --- |
| Título | Meu extrato |
| Subtítulo | Acompanhe comissões, bônus e pagamentos. Valores pendentes podem mudar até aprovação do financeiro. |
| Card resumo — pendente | A receber (pendente) |
| Card resumo — próximo | Próximo pagamento previsto |
| Card resumo — pago mês | Pago em {{mes}} |
| Helper datas pagamento | Pagamentos costumam ocorrer todo dia **10**, referentes à competência do mês anterior. |
| Coluna loja | Loja |
| Coluna competência | Competência |
| Coluna valor | Valor |
| Coluna status | Status |
| Empty | Você ainda não tem lançamentos. Quando lojas forem vinculadas à sua carteira, as comissões aparecerão aqui. |
| Erro sessão | Sua sessão expirou. Faça login novamente. |
| Erro permissão | Você não tem acesso a esta área. |
| Link dados bancários | Meus dados de pagamento |
| Aviso dados incompletos | Cadastre sua chave PIX para receber pagamentos. |

**O que o rep NÃO vê na v1:** dados de outros representantes, chaves PIX completas de terceiros, ajustes internos não vinculados à sua carteira.

---

## 9. Campanhas de incentivo

**Rota:** `/painel/equipe/campanhas`

| Elemento | Copy |
| --- | --- |
| Título | Campanhas de incentivo |
| Subtítulo | Metas temporárias com bônus para a equipe comercial. |
| Botão nova | Nova campanha |
| Coluna nome | Campanha |
| Coluna período | Período |
| Coluna meta | Meta |
| Coluna bônus | Bônus |
| Coluna status | Status |
| Status draft | Rascunho |
| Status active | Ativa |
| Status closed | Encerrada |
| Empty | Nenhuma campanha cadastrada. |
| Empty CTA | Criar primeira campanha |

### Formulário campanha

| Elemento | Copy |
| --- | --- |
| Título criar | Nova campanha |
| Label nome | Nome da campanha |
| Placeholder | Ex.: Junho — 3 fechamentos = bônus R$ 500 |
| Label início | Início |
| Label fim | Término |
| Label métrica | Meta baseada em |
| Métrica closed_dealerships | Fechamentos (lojas) |
| Métrica setup_count | Setups vendidos |
| Métrica mrr_total_cents | Valor de mensalidades (R$) |
| Label meta | Quantidade da meta |
| Label bônus | Valor do bônus (R$) |
| Label elegíveis | Representantes elegíveis |
| Opção todos | Todos os ativos |
| Opção selecionar | Selecionar representantes |
| Botão publicar | Ativar campanha |
| Toast ativa | Campanha ativada. |
| Toast meta atingida (admin) | Meta atingida — bônus lançado no extrato de {{nome_rep}}. |
| Toast meta rep | Parabéns! Você atingiu a meta «{{nome_campanha}}». O bônus aparecerá no seu extrato. |

---

## 10. Lotes de pagamento (financeiro)

**Rota:** `/painel/equipe/pagamentos`

| Elemento | Copy |
| --- | --- |
| Título | Lotes de pagamento |
| Subtítulo | Feche competências, exporte PIX e marque pagamentos realizados. |
| Botão gerar | Gerar lote |
| Coluna referência | Competência |
| Coluna pagamento | Data de pagamento |
| Coluna valor total | Valor total |
| Coluna reps | Representantes |
| Coluna status | Status |
| Status draft | Rascunho |
| Status processing | Em processamento |
| Status paid | Pago |
| Ação exportar | Exportar CSV |
| Ação marcar pago | Marcar como pago |
| Modal marcar pago título | Confirmar pagamento do lote? |
| Modal marcar pago corpo | Isso marca todos os lançamentos deste lote como pagos. Confirme que as transferências/PIX foram realizadas. |
| Toast lote gerado | Lote {{referencia}} gerado com {{n}} representante(s). |
| Toast pago | Lote marcado como pago. |
| Empty | Nenhum lote de pagamento. Gere um lote após aprovar lançamentos pendentes. |

### CSV export (cabeçalhos amigáveis)

| Coluna arquivo | Copy |
| --- | --- |
| rep_nome | Nome |
| rep_email | E-mail |
| rep_cpf | CPF |
| valor | Valor (R$) |
| pix_tipo | Tipo PIX |
| pix_chave | Chave PIX |
| competencia | Competência |

---

## 11. Churn em 30 dias (estorno)

| Elemento | Copy |
| --- | --- |
| Banner admin (loja cancelada) | Loja cancelada em menos de 30 dias — estorno de comissões gerado automaticamente. |
| Toast estorno | Estorno registrado no extrato do representante. |
| Linha extrato (rep) | Estorno — {{nome_loja}} cancelou em {{dias}} dias |
| Modal detalhe estorno | Comissões pagas ou aprovadas referentes a esta loja foram estornadas conforme política de cancelamento em 30 dias. |
| Erro estorno parcial | Não foi possível calcular o estorno. Verifique os lançamentos da loja. |

---

## 12. Inativação de representante

| Elemento | Copy |
| --- | --- |
| Ação menu | Inativar representante |
| Modal título | Inativar representante? |
| Modal corpo | {{nome}} não receberá novas comissões. Repasse a carteira antes de inativar, se ainda houver lojas ativas. |
| Checkbox | Já repassei ou não há lojas na carteira |
| Botão confirmar | Inativar |
| Toast | Representante inativado. |
| Erro lojas pendentes | Este representante ainda tem {{n}} loja(s) na carteira. Repasse a carteira antes de inativar. |

---

## 13. Erros globais (admin comercial)

| Situação | Copy |
| --- | --- |
| 403 | Você não tem permissão para esta ação. |
| 404 rep | Representante não encontrado. |
| 404 loja | Concessionária não encontrada. |
| 500 | Erro interno. Tente novamente em instantes. |
| Rede | Sem conexão. Verifique sua internet e tente novamente. |
| Sessão expirada | Sua sessão expirou. Faça login novamente. |

---

## 14. Notificações por e-mail (fase posterior — copy reservada)

| Evento | Assunto | Preview |
| --- | --- | --- |
| Novo vínculo | Loja vinculada à sua carteira | {{nome_loja}} foi adicionada à sua carteira comercial. |
| Bônus campanha | Bônus de campanha creditado | Você recebeu um bônus de {{valor}} — {{campanha}}. |
| Pagamento realizado | Pagamento de comissões — {{competencia}} | Seu pagamento de {{valor}} foi processado. |
| Repasse carteira | Carteira repassada | {{n}} loja(s) foram transferidas para sua carteira a partir de {{data}}. |

---

## 15. Handoff UX (Fase 3)

Telas a desenhar com estes textos:

1. Lista representantes (+ filtros + empty)
2. Form cadastro/edição (+ dados bancários em abas)
3. Drawer vínculo comercial (split SDR/closer)
4. Wizard repasse de carteira (multi-step se muitas lojas)
5. Extrato admin (tabela + bulk approve + export)
6. Portal rep — Meu extrato (mobile-first)
7. CRUD campanhas
8. Lotes pagamento + modal marcar pago
9. Estados: loading, empty, error, permission-denied, rep inactive

**Componentes shared prováveis:** `DataTable`, `Badge`, `AlertDialog`, `Sheet`, `CurrencyDisplay`, máscara PIX.

---

**Próximo passo:** Fase 3 UX Agent — inventário de telas + jornadas usando esta copy.
