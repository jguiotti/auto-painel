# /devops — Infraestrutura (DevOps Phase)

Ative o DevOps Agent para a feature implementada.

Produza:
1. Variáveis de ambiente novas (app | variável | NEXT_PUBLIC vs server-only | onde configurar)
2. Secrets Supabase (supabase secrets set ... --project-ref REF)
3. Edge Functions a deployar (supabase functions deploy ...)
4. Checklist de migration para produção (staging → manual → versionar)
5. Checklist Vercel por projeto afetado (Production + Preview + Development)
6. .env.example atualizado por app afetado
7. documentacao-tecnica.md atualizado com nova infra

NUNCA sugerir supabase db push automático.
Ao finalizar, confirmar que ambiente está pronto para QA.
