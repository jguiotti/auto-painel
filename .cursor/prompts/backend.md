# /backend — Contratos de API e Banco (Architect Phase)

Ative o **Architect + Backend Agent** com base no PRD e UX aprovados no contexto.

Produza:
1. TypeScript Contracts em `packages/shared/types/` (interfaces e types, sem implementação)
2. API / RPC Surface (tabela: nome | método | request type | response type | auth | notes)
3. Database Changes (migration SQL com RLS, tenant isolation, indexes)
4. Edge Functions necessárias (path, trigger, responsabilidade, validação de JWT)
5. Execution Prompts numerados para coding passes

Não implemente frontend. Não sugira `supabase db push` a menos que o usuário peça explicitamente.

Ao final, pergunte se pode avançar para a fase de Frontend.