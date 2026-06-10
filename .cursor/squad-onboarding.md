# /onboarding — Onboarding da Squad no projeto AutoPainel

Conduza o onboarding técnico e de produto de toda a squad no monorepo AutoPainel.
Cada agente lê o projeto, aprende suas responsabilidades e documenta seus achados.
Execute fase por fase na ordem abaixo.

---

## ANTES DE COMEÇAR — Leitura obrigatória

Leia os seguintes arquivos e absorva antes de qualquer análise:
```
@README.md (ou AGENTS.md se existir na raiz)
@package.json (raiz — Turborepo)
@apps/admin-master/
@apps/dealership-panel/
@apps/customer-site/
@packages/shared/
@supabase/migrations/
@packages/shared/docs/
@apps/admin-master/content/internal-docs/
```

---

## FASE 1 — PM Agent: Negócio e produto

Ative o PM Agent e produza:

### 1.1 Visão geral do produto
- O que é o AutoPainel? Para quem? Qual problema resolve?
- Quais os 4 apps e suas audiências?

### 1.2 Funcionalidades existentes por app
Para cada app, liste features implementadas:
```
App: dealership-panel
Feature: [nome] | Status: implementada/parcial | Resumo: ...
```

### 1.3 SaaS Modules identificados
Quais módulos/features gated existem? Quais tabelas/funções os controlam?

### 1.4 Regras de negócio permanentes
Extraia do código e docs em formato BR-[N].

### 1.5 Gaps e oportunidades
O que está incompleto ou ausente?

---

## FASE 2 — UX Writer Agent: Voz e copy

Ative o UX Writer Agent e produza:

### 2.1 Inventário de copy existente
Mapeie textos voltados ao usuário: botões, labels, empty states, erros, toasts.
Separados por app (admin-master / dealership-panel / customer-site).

### 2.2 Avaliação de consistência
O copy existente segue as vozes definidas por audiência? Identifique inconsistências.

### 2.3 Glossário atual
Termos do domínio automotive usados na plataforma. Há inconsistências (veículo vs. carro vs. auto)?

### 2.4 Gaps de copy
Telas com copy faltando, estados sem mensagem, erros expostos em inglês para usuário final?

---

## FASE 3 — UX Agent: Interface e fluxos

Ative o UX Agent e produza:

### 3.1 Mapa de rotas por app
Liste todas as rotas de cada app e o que fazem.

### 3.2 Componentes de UI existentes
Mapeie packages/shared/src/ui/ e components em cada app.
O que está em shared vs. duplicado em apps?

### 3.3 Padrões de estados
Como a plataforma trata loading, empty, error hoje? É consistente entre apps?

### 3.4 Design system health
O design-system-and-shadcn.mdc está sendo seguido? Algum app tem shadcn instalado diretamente?

---

## FASE 4 — Arquiteto Supabase: Schema e contratos

Ative o Arquiteto Supabase e produza:

### 4.1 Schema atual do banco
Para cada tabela em supabase/migrations/:
```
Tabela: [nome] | Propósito: | Colunas principais: | RLS: sim/não | tenant_id: sim/não | soft-delete: sim/não
```

### 4.2 RLS health check
Alguma tabela com dados de tenant sem RLS? Alguma política de isolamento incompleta?

### 4.3 RPCs e Edge Functions existentes
Liste com responsabilidade e se são tenant-scoped.

### 4.4 TypeScript types health
packages/shared/src/types/ está completo e alinhado ao schema real?
Alguma tabela sem tipos definidos?

### 4.5 Dívida técnica de arquitetura
Migrations sem rollback documentado? Tabelas sem tenant_id que deveriam ter?

---

## FASE 5 — Backend Agent: Código server-side

Ative o Backend Agent e produza:

### 5.1 Server actions existentes
Liste por app: arquivo, o que faz, se usa tenant isolation corretamente.

### 5.2 Padrões de acesso a dados
Como os apps buscam dados do Supabase hoje? Direto em componentes? Via server actions? Via hooks?

### 5.3 Vulnerabilidades de tenant isolation
Alguma query sem .eq('tenant_id', ...) explícito além do RLS?
Algum dado retornado sem filtrar deleted_at?

### 5.4 Dívida técnica backend
TODOs, any sem justificativa, erros Supabase expostos ao cliente?

---

## FASE 6 — Frontend Agent: Código de UI

Ative o Frontend Agent e produza:

### 6.1 Estrutura de componentes
Como cada app organiza pages/, components/, e onde estão os hooks?

### 6.2 Design system compliance
Algum app importando shadcn diretamente (não via @autopainel/shared/ui)?
Algum componente duplicado entre apps que deveria estar em packages/shared?

### 6.3 Estados de UI
Quais componentes tratam corretamente loading/empty/error/success?
Quais estão faltando estados?

### 6.4 naming-and-language compliance
Algum identificador em português no código? Alguma rota em inglês? Algum copy hardcoded em inglês visível ao usuário?

### 6.5 Dívida técnica frontend
'use client' desnecessário? Types redefinidos localmente que deveriam vir de packages/shared?

---

## FASE 7 — DevOps Agent: Infraestrutura

Ative o DevOps Agent e produza:

### 7.1 Projetos Vercel
Quais projetos existem? Como cada app está configurado (root dir, build command, output)?

### 7.2 Variáveis de ambiente
O que está documentado em .env.example? Há variáveis faltando ou desatualizadas?
Algum segredo em NEXT_PUBLIC_ que não deveria estar?

### 7.3 CI/CD
Quais GitHub Actions workflows existem? O que automatizam?

### 7.4 Checklist de setup para novo desenvolvedor
Passo a passo para rodar o monorepo localmente do zero.

---

## FASE 8 — QA Agent: Qualidade e riscos

Ative o QA Agent e produza:

### 8.1 Testes existentes
O que está coberto por testes? O que está totalmente sem cobertura?

### 8.2 Tenant isolation audit
Para as tabelas mais críticas (leads, vehicles, financials), confirmar RLS + explicit tenant_id em queries.

### 8.3 Riscos identificados
Lista priorizada de riscos de qualidade, segurança ou confiabilidade já existentes.

### 8.4 Checklist de saúde do projeto
```
[ ] RLS em todas as tabelas tenant-scoped
[ ] Nenhum segredo em NEXT_PUBLIC_*
[ ] Migrations versionadas e completas
[ ] .env nunca commitado
[ ] Todos os apps com naming-and-language correto
[ ] Design system: nenhum app com shadcn direto
[ ] internal-docs atualizado e alinhado ao código
```

---

## RESULTADO FINAL — Documento de Onboarding

Consolide:
1. O que é o AutoPainel (2-3 frases)
2. Apps e audiências
3. Stack e arquitetura do monorepo
4. Funcionalidades por app
5. Regras de negócio permanentes (BR-N)
6. Dívida técnica priorizada (por severidade)
7. Riscos de segurança / tenant isolation
8. Checklist de setup local para novo dev
