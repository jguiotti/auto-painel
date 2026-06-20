# Manual de onboarding — AutoPainel

> **Para quem é este guia?** Qualquer pessoa da equipe AutoPainel — comercial, suporte, operações ou gestão — que precise entender a plataforma e operar o dia a dia **sem conhecimento técnico**.

---

## Bem-vindo

A **AutoPainel** é uma plataforma SaaS para concessionárias de veículos. Cada cliente (loja) recebe:

- uma **vitrine pública** para exibir o estoque;
- um **painel da loja** para gerir veículos, leads e integrações;
- módulos opcionais conforme o **plano contratado** (simulador, QR Code, portais, redes sociais, etc.).

A equipe AutoPainel opera tudo pelo **Admin** (`admin.autopainel.com.br`), onde se criam lojas, planos, convites e configurações da plataforma.

---

## Como a plataforma funciona

### Os quatro sites

| O quê | Para quem | URL em produção |
| --- | --- | --- |
| **Site marketing** | Público geral | autopainel.com.br |
| **Admin** | Equipe AutoPainel | admin.autopainel.com.br |
| **Painel da loja** | Dono/gestor/vendedor da concessionária | `{slug}.loja.autopainel.com.br` |
| **Vitrine** | Compradores da concessionária | `{slug}.autopainel.com.br` |

O **`slug`** é o identificador curto da loja (ex.: `guiotti`, `demo`). Ele aparece no endereço e liga vitrine, painel e dados no banco.

### Fluxo resumido

```
Equipe AutoPainel (Admin)
        ↓ cria loja + plano + convite
Gestor da concessionária (Painel)
        ↓ cadastra veículos, leads, integrações
Comprador (Vitrine)
        ↓ navega estoque e envia contato
```

---

## Papéis e quem faz o quê

| Papel | Onde entra | Responsabilidade |
| --- | --- | --- |
| **Super admin** | Admin | Cria lojas, define plano, convida equipe, configura whitelabel |
| **Owner (dono)** | Painel da loja | Dono da concessionária — acesso total da loja |
| **Manager (gestor)** | Painel da loja | Operação diária (estoque, leads, integrações) |
| **Seller (vendedor)** | Painel da loja | CRM e leads atribuídos a ele |

**Importante:** convites de colaboradores são feitos **somente no Admin** (aba Equipe da concessionária). O painel da loja não envia convites.

---

## Planos e módulos

### O que é um plano?

Cada loja tem **um plano** (Starter, Business ou Enterprise). O plano define **quais módulos** a loja pode usar. Não existe “marcar módulo avulso” na ficha da loja — tudo passa pelo plano.

### Módulos disponíveis

| Módulo | O que a loja ganha |
| --- | --- |
| **Base (todos os planos)** | Estoque, vitrine, captura de leads |
| **Simulador de financiamento** | Simulação de parcelas na vitrine |
| **QR Code do veículo** | QR na ficha do estoque |
| **Métricas avançadas** | Dashboard com indicadores extras |
| **OLX** | Publicar e remover anúncios na OLX |
| **WebMotors** | Publicar e remover anúncios na WebMotors |
| **iCarros** | Publicar e remover anúncios no iCarros |
| **Redes sociais (Meta)** | Conectar Facebook/Instagram e publicar posts |
| **Recibo de venda** | Recibo simples após venda |

### Como os módulos se ligam aos planos

| Plano | Módulos incluídos |
| --- | --- |
| **Starter** | Só o pacote base (estoque + vitrine + leads) |
| **Business** | Base + **Simulador** + **QR Code** |
| **Enterprise** | Base + Business + integrações (OLX, WebMotors, iCarros, Meta) + métricas avançadas e demais módulos premium |

**Na prática:** ao criar ou editar uma loja no Admin, você escolhe o **plano**. O sistema libera automaticamente os módulos daquele plano — o gestor da loja vê no painel apenas o que o plano permite.

### Templates da vitrine

Ao criar a loja, escolha também o **layout da vitrine**:

| Layout | Estilo |
| --- | --- |
| **1 — Premium** | Filtros na lateral, visual mais sofisticado |
| **2 — Performance** | Hero central, grid em 2 colunas |
| **3 — Tech** | Destaques em blocos, grid em 4 colunas |

O conteúdo da **página inicial** da vitrine (textos, hero, faixas) é editado **somente no Admin** — a loja não altera isso sozinha na v1.

---

## Como criar uma nova loja (passo a passo)

### 1. Cadastrar no Admin

1. Acesse **admin.autopainel.com.br** com seu usuário super admin.
2. Vá em **Concessionárias** → **Nova concessionária**.
3. Preencha:
   - **Nome** da loja (ex.: Guiotti Multimarcas)
   - **Slug** (ex.: `guiotti`) — minúsculas, sem espaços; será usado na URL
   - **Plano** (Starter / Business / Enterprise)
   - **Layout** da vitrine (1, 2 ou 3)
   - Dados de contato e status **ativo**
4. Salve.

### 2. Publicar na internet (DNS + Vercel)

Para a loja ficar acessível em produção, a equipe técnica executa:

```bash
npm run dealership:hosts:provision -- guiotti
```

Depois, no **Registro.br** (ou Cloudflare), criam-se dois registros CNAME apontando para os endereços que o script informar — um para a vitrine e outro para o painel.

| Endereço final | Exemplo |
| --- | --- |
| Vitrine | `guiotti.autopainel.com.br` |
| Painel | `guiotti.loja.autopainel.com.br` |

> **Dica:** sem o DNS, a loja existe no sistema mas os links públicos não abrem. Combine com a equipe técnica antes de prometer URL ao cliente.

### 3. Convidar o gestor

1. No Admin, abra a concessionária → aba **Equipe**.
2. **Convidar** com o e-mail do dono/gestor.
3. O convidado recebe o link, define senha e acessa o painel em `{slug}.loja.autopainel.com.br`.

### 4. Checklist antes de entregar ao cliente

- [ ] Loja **ativa** no Admin
- [ ] Plano correto (módulos que o cliente contratou)
- [ ] Vitrine abre em HTTPS (`{slug}.autopainel.com.br`)
- [ ] Painel abre em HTTPS (`{slug}.loja.autopainel.com.br`)
- [ ] Gestor consegue entrar e ver o menu esperado do plano
- [ ] Whitelabel da home configurado (se aplicável)

---

## Dia a dia no Admin

| Tarefa | Onde fazer |
| --- | --- |
| Ver todas as lojas | Concessionárias |
| Alterar plano de uma loja | Ficha da concessionária → Plano |
| Editar textos da home da vitrine | Ficha → Conteúdo / Whitelabel |
| Convidar ou remover usuário da loja | Ficha → Equipe **ou** menu **Usuários das lojas** |
| Ver todos os usuários das lojas | **Usuários das lojas** (`/painel/usuarios`) |
| Operadores do painel administrativo | **Equipe AutoPainel** (`/painel/equipe`) — `super_admin` |
| Vendedores comerciais internos (comissão) | **Em implementação** — PRD + copy prontos; ver `PRD_PLATFORM_SALES_SQUAD.md` |
| Consultar documentação | Menu **Documentação interna** |
| Lojas demo para testes | Slugs `guiotti`, `autoprime`, `ecodrive`, `demo` |

---

## Equipe comercial AutoPainel (BZ — PM aprovado jun/2026)

> PRD: `packages/shared/docs/PRD_PLATFORM_SALES_SQUAD.md` · Copy: `UX_COPY_PLATFORM_SALES_SQUAD.md`

| ID | Regra |
| --- | --- |
| BZ-SQ-01 | Comissão só após vínculo comercial **confirmado** e loja faturando |
| BZ-SQ-02 | **Comissão recorrente** mensal enquanto a loja estiver ativa na carteira do representante |
| BZ-SQ-03 | Cancelamento da loja em **até 30 dias** após fechamento → **estorno total** das comissões já creditadas |
| BZ-SQ-04 | Representante que sai → **repasse de carteira** para outro rep; comissões futuras vão ao novo responsável |
| BZ-SQ-05 | Split SDR + closer na mesma loja: soma das participações ≤ 100% |
| BZ-SQ-06 | Representante comercial ≠ operador `super_admin` ≠ vendedor da loja cliente |
| BZ-SQ-07 | Representante vê **próprio extrato** e edita **próprios** dados PIX (v1) |

**Onde operar (quando implementado):** menu Equipe comercial · portal `/painel/comercial/extrato` (rep).

---

| Integração | O que o gestor faz no painel | Observação |
| --- | --- | --- |
| **Meta (Facebook/Instagram)** | Conectar páginas e publicar carrosséis | App Review Meta em andamento; loja **demo** serve para homologação |
| **OLX / WebMotors / iCarros** | Conectar conta e publicar veículos | Disponível em planos com o módulo; homologação com cada portal |

O gestor **não** configura chaves de API — a plataforma usa credenciais centralizadas da AutoPainel.

---

## Lojas de demonstração

Use para treinar a equipe ou testar antes de ir ao cliente:

| Loja | Slug | Plano | Uso |
| --- | --- | --- | --- |
| Guiotti | `guiotti` | Enterprise | Integrações completas |
| AutoPrime | `autoprime` | Business | Plano intermediário |
| EcoDrive | `ecodrive` | Starter | Plano entrada |
| Demo | `demo` | Enterprise | Homologação Meta |

**Painel demo:** `https://demo.loja.autopainel.com.br`  
**Vitrine demo:** `https://demo.autopainel.com.br`

---

## Perguntas frequentes

**A loja não abre no navegador.**  
Provavelmente falta DNS ou o slug está errado. Confirme com a equipe técnica o comando `dealership:hosts:provision` e os CNAME.

**O gestor não vê o simulador / OLX / Meta.**  
Verifique o **plano** da loja no Admin. Starter não inclui integrações; Business inclui simulador e QR; Enterprise inclui portais e Meta.

**Posso editar as regras de produto aqui no painel?**  
Não. Este manual é **somente leitura**. Atualizações são feitas pela equipe no repositório (git), via pull request.

**Onde está o histórico técnico antigo (PRDs, migrações)?**  
Arquivado em `historico-prds.md` e `historico-tecnico.md` no repositório. Desenvolvedores usam a **Documentação técnica** no Admin.

---

## Precisa de ajuda técnica?

Abra **Documentação interna → Documentação técnica** no Admin — lá estão instalação, APIs, integrações e deploy para desenvolvedores.

---

## Comunicação por e-mail (régua)

Especificação completa da squad (convites, boas-vindas, recuperar senha, marca AutoPainel vs marca da loja): **`packages/shared/docs/EMAIL_COMMUNICATION_REGUA.md`**.

**Resumo operacional:**

| Quem recebe | Marca no e-mail | Disparo principal |
| --- | --- | --- |
| Operador **Admin** | AutoPainel | Convite + recuperar senha |
| Colaborador **painel da loja** | Logo/tema da concessionária | Convite (definir senha) + recuperar senha |
| Cliente **gestor** (onboarding) | AutoPainel (manual) | E-mail com URLs vitrine + painel após DNS |

**Hoje:** convite de colaborador dispara e-mail automático com link para definir senha (Fase 1 entregue). E-mail whitelabel por loja: Fase 2 pendente.

---

## Épico feedback operacional (PRD aprovado — jun/2026)

Ajustes solicitados por lojistas após uso real. **Status: encerrado (2026-06-19)** — P0, P1 e P2 em produção; ver `documentacao-tecnica.md`.

### Decisões PM (Open Questions fechadas)

| Tema | Decisão |
| --- | --- |
| Ordem destaques | Campo numérico «posição» |
| Quem reordena | Apenas owner e manager |
| QR A4 financiamento | Bloco de texto livre |
| Leads novos sem dono | Todos os vendedores veem; «puxar para mim»; só gestor repassa entre vendedores |
| Excluir lead | Hard-delete |
| Convite equipe | Painel (titular) **convive** com convite admin-master |
| E-mail novo lead | Toda equipe comercial (owner, manager, seller) |
| Cadastro cliente | Entidade **customer** 1:N **leads** |
| Despublicar portal | Granular por portal |

### Regras de negócio (resumo)

| ID | Regra |
| --- | --- |
| **BZ-FO-001** | WhatsApp na ficha do veículo abre modal de lead (igual flutuante) antes de abrir WhatsApp; lead sempre com veículo. |
| **BZ-FO-002** | Filtros `/estoque` mobile não empurram listagem além de 1 viewport (sheet/drawer). |
| **BZ-FO-003** | Estoque painel: filtros + paginação; destaques com campo posição (owner/manager). |
| **BZ-FO-004** | QR aponta vitrine `{slug}.autopainel.com.br/veiculo/...`; impressos usam logo fundo claro. |
| **BZ-FO-005** | Status lead: Novo, Em atendimento, Contato quente, Contato frio, Venda ganha, Venda perdida; perda exige motivo. |
| **BZ-FO-006** | Customer enriquecido (documento, endereço); leads vinculados; veículo interesse = estoque inteiro. |
| **BZ-FO-007** | Equipe: só **owner** convida/edita; manager/seller sem acesso à página. |
| **BZ-FO-008** | E-mail transacional a equipe comercial a cada novo lead. |
| **BZ-FO-009** | Admin: logo fundo claro + logo fundo escuro; vitrine segue tema; painel/impressos sempre logo claro. |
| **BZ-FO-010** | Despublicar classificados: ação por portal (OLX, WebMotors, iCarros). Meta **fora** deste épico. |
| **BZ-FO-011** | Exclusão de contato no CRM: confirmação via `ConfirmActionDialog` (nunca `window.confirm`). |

Detalhe técnico: `documentacao-tecnica.md`.

---

## Épico crescimento & operação (jun/2026)

### Decisões PM

| Tema | Decisão |
| --- | --- |
| Loja inativa | Bloqueia **painel e vitrine** até pagamento confirmado |
| Preços públicos | R$ 197 / 397 / 997 (Essencial / Profissional / Completo); setup único **R$ 497** |
| Faixas de estoque | Essencial até 40 · Profissional 41–80 · Completo 81+ veículos ativos |
| CRM B2B | Módulo **`/painel/leads-comerciais`** |
| Auto-provision | Sim — Cloudflare + Vercel após criar loja no admin |
| Guiotti + Demo | Sempre ativas; `billing_exempt`; não inativar/excluir |

### Regras de negócio (resumo)

| ID | Regra |
| --- | --- |
| **BZ-GR-001** | Loja `suspended` ou `pending_setup`: vitrine mostra `/loja-inativa` (shell genérico); estoque e páginas públicas não acessíveis. |
| **BZ-GR-002** | Painel: utilizador autenticado com loja não `active` redireciona para `/conta-inativa`. |
| **BZ-GR-003** | Preços no marketing-site refletem `pricing_plans.price_amount`; fallback estático alinhado aos mesmos valores. |
| **BZ-GR-004** | Leads do site entram em `saas_prospects` com pipeline comercial gerido no admin. |
| **BZ-GR-005** | Slugs `guiotti` e `demo` são referência interna — protegidos contra inativação e exclusão. |
| **BZ-GR-006** | Contrato comercial: rascunho editável (notas); envio congela `body_snapshot_md`; assinatura registra `signature_provider_ref`. |
| **BZ-GR-007** | Calendário editorial marketing gerido no admin (`platform_content_calendar_items`). |

### Microcopy (Fase 2 — UX Writer)

| Superfície | Título / mensagem |
| --- | --- |
| **Marketing `/planos`** | Mensalidade a partir de R$ 197/mês; setup único R$ 497; faixas por estoque (40 / 41–80 / 81+ veículos); FAQ com valores |
| **Vitrine `/loja-inativa`** | Título: nome da loja ou «Loja temporariamente indisponível»; corpo: pausa até regularização do plano; CTA WhatsApp suporte |
| **Painel `/conta-inativa`** | «Conta inativa» — pagamento pendente ou configuração; painel e vitrine indisponíveis até regularização |
| **Admin `/painel/leads-comerciais`** | Pipeline: Novo → Qualificação → Demo agendada → Demo realizada → Proposta → Negociação → Ganho / Onboarding / Perdido |
| **Contato marketing** | WhatsApp **+55 13 99743-5851**; e-mail **contato@autopainel.com.br** |
| **Marketing WhatsApp (float + contato)** | Popup único com formulário de lead; **não** abre `wa.me` — equipe retorna pelo número informado |

*Última atualização: junho/2026 (épico crescimento em andamento)*
