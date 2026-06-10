# /backend — Implementação Backend (Backend Phase)

Ative o Backend Agent. Confirmar antes de escrever código:
- Contratos TypeScript em packages/shared/src/types
- Migrations SQL escritas
- RPC/API surface definida

Ao implementar:
- Server actions com 'use server' (Next.js App Router)
- Supabase client de @autopainel/shared/lib/supabase
- Toda query com .eq('tenant_id', tenantId) explícito
- .is('deleted_at', null) em toda tabela com soft-delete
- Module gate check quando aplicável
- Erros Supabase mapeados para AppError — nunca retornar raw error
- Tipos de packages/shared — nunca redefinir localmente

Path completo + implementação completa por arquivo (sem TODO).
