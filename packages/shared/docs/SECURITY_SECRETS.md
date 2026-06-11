# Segredos — env local e histórico git

## O que nunca vai para o git

| Ficheiro | Conteúdo |
| --- | --- |
| `.env.local` (raiz) | URL/keys Supabase, senha Postgres remota, access token CLI |
| `apps/*/.env.local` | Cópia sincronizada (`npm run sync:env`) — mesma regra |
| `supabase/.env.local` | Segredos locais das Edge Functions |

**Permitido versionar:** apenas `.env.example` (sem valores reais).

## Verificação rápida

```bash
npm run env:check-tracked
```

Se falhar:

```bash
npm run git:untrack-env
git commit -m "chore: stop tracking local env files"
```

## Deploy sem expor senha/token no terminal

`scripts/supabase-deploy.mjs` redige `--password` e `--token` nos logs. Mesmo assim, não cole segredos em issues, PRs ou chats.

## Apagar segredos do histórico git

Use quando um token ou senha foi **commitado** ou precisa sair de commits antigos no remoto.

### 1. Instalar ferramenta

```bash
brew install git-filter-repo
```

### 2. Listar segredos a purgar (local, gitignored)

```bash
cp .secrets-purge-local.example.txt .secrets-purge-local.txt
# Edite .secrets-purge-local.txt — uma linha por valor literal (token sbp_..., senha, etc.)
```

### 3. Simular

```bash
npm run git:purge-secrets -- --dry-run
```

### 4. Aplicar (reescreve histórico)

```bash
npm run git:purge-secrets
git push --force-with-lease origin main
```

**Coordene com a equipa:** todos devem `git fetch` + `git reset --hard origin/main` (ou clone novo) após o force-push.

### Nota sobre o terminal

Segredos que apareceram só na **saída do terminal** (antes da redação no script) **não** estão no git automaticamente. O purge só é necessário se o valor existir em algum ficheiro commitado.

`git log -S` em todo o histórico **pode travar** em monorepos grandes; o dry-run do script usa apenas scan do working tree. Auditoria manual (limitada):

```bash
git log --oneline -n 30 -S "sbp_"
```

## Git travado (`unable to map index file`)

Se `git status` falha com timeout no `.git/index`:

1. Liberte **espaço em disco** (recomendado > 15 GB livres).
2. Mate processos presos: `pkill -9 -f "git status"; pkill -9 -f "git read-tree"`
3. Repare: `npm run git:repair-index`
4. Commite só ficheiros necessários (evita `git add -A` com disco cheio).

## GitHub Actions

Secrets em **Settings → Secrets and variables → Actions** — não em ficheiros no repositório.
