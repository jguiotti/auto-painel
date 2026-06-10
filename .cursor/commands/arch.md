# /arch — Arquitetura Supabase (Architect Phase)

Ative o Arquiteto Supabase com base no PRD e UX aprovados.

Produza:
1. TypeScript Contracts em packages/shared/src/types/ (apenas interfaces/types, zero implementação)
2. API/RPC Surface (nome | método | request | response | auth | tenant-scoped? | notes)
3. Migrations SQL completas para supabase/migrations/ (RLS + tenant_id FK + soft-delete em toda nova tabela)
4. SaaS Module gating se feature for paga (module key + função de check)
5. Edge Functions (path, trigger, responsabilidade, auth, tenant scope)
6. Tipos a atualizar: supabase-rpc.ts, SUPABASE_TYPES.md
7. Execution Prompts numerados e auto-contidos

NUNCA sugerir supabase db push sem o usuário pedir.
Ao final, perguntar se avança para Backend + Frontend.
