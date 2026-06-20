# Desenvolvimento com Supabase remoto (recomendado)

Guia para usar **um único banco** (projeto hospedado) no dia a dia local e evitar conflito com Docker/local.

---

## Resposta curta

**Sim, é possível** — e é o fluxo recomendado para a equipe:

| Ambiente | Supabase | Quando usar |
| --- | --- | --- |
| **Dev local (apps)** | Remoto `https://<ref>.supabase.co` | Trabalho diário, vitrine, painel, admin |
| **Docker local** | `http://127.0.0.1:54321` | Só testar migrações destrutivas ou offline |

Usuários reais e lojas **não são recriados** enquanto você **não** rodar `supabase db reset`, `supabase:reset:dev` nem `seed:*` apontando para o remoto (esses scripts agora **bloqueiam** URL remota).

---

## `.env.local` — configuração remota

Na **raiz** do monorepo:

```bash
# Supabase REMOTO (mesmo projeto da produção/staging)
NEXT_PUBLIC_SUPABASE_URL=https://wcgevmvystdhqpzwuyig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do Dashboard → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<service role — só scripts/admin, nunca no browser>

# Multi-tenant local
NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost

# Painel auth local
NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN=http://guiotti.localhost:3002
```

Depois:

```bash
npm run sync:env
# Reinicie npm run dev:all
```

**Importante:** URL e `ANON_KEY` devem ser **do mesmo projeto**. Misturar `127.0.0.1:54321` com chave remota (ou o contrário) causa exatamente os erros de vitrine que você viu.

Remova ou comente blocos duplicados de `SUPABASE_URL` / `SUPABASE_ANON_KEY` se existirem no mesmo arquivo.

---

## URLs locais das vitrines

Com remoto + `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost`:

| Loja | Vitrine | Painel |
| --- | --- | --- |
| Guiotti | http://guiotti.localhost:3003 | http://guiotti.localhost:3002 |
| Demo | http://demo.localhost:3003 | http://demo.localhost:3002 |

O slug precisa existir no **banco remoto** com host/situação publicável.

---

## O que NÃO rodar com banco remoto

| Comando | Motivo |
| --- | --- |
| `npm run supabase:reset` | Apaga e recria o Postgres |
| `npm run supabase:reset:dev` | Reset + seeds demo |
| `npm run seed:demo-users` | Cria/redefine usuários demo |
| `npm run seed:admin-user` | Cria/redefine super admin demo |

Migrações no remoto: **`npm run supabase:deploy`** (CI ou manual), nunca reset.

---

## Quando ainda usar Supabase local

- Validar migração SQL antes do deploy
- Testar Edge Functions sem afetar produção
- E2E isolado

Nesse caso, use **outro** `.env.local` (ou perfil) só com `127.0.0.1:54321` e chaves de `supabase status -o env`. Não alterne linhas no mesmo arquivo sem `sync:env` + restart.

---

## Checklist rápido

```
[ ] NEXT_PUBLIC_SUPABASE_URL = https://....supabase.co
[ ] ANON_KEY e SERVICE_ROLE do mesmo projeto (Dashboard)
[ ] npm run sync:env
[ ] Reiniciar dev servers
[ ] Abrir http://SLUG.localhost:3003 (não localhost:3003 nu)
[ ] Loja publicável no Admin Master
```

Ver também: [`SUPABASE_LOCAL.md`](./SUPABASE_LOCAL.md) · [`SUPABASE_DEPLOY.md`](./SUPABASE_DEPLOY.md)
