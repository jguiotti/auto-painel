#!/usr/bin/env bash
# Copia só ficheiros alterados (lista fixa) da pasta iCloud → clone em ~/Developer.
# Evita rsync completo que trava ao ler Documents.
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/Developer/auto-painel}"

if [[ ! -d "$DEST/.git" ]]; then
  echo "Destino inválido: $DEST (corra git-recover-outside-icloud.sh primeiro)"
  exit 1
fi

# Paths alterados nesta sessão (segurança + supabase + logos)
PATHS=(
  .gitignore
  .env.example
  .secrets-purge-local.example.txt
  package.json
  scripts/check-env-not-tracked.mjs
  scripts/untrack-env-from-git.sh
  scripts/git-purge-secrets-from-history.sh
  scripts/git-repair-index.sh
  scripts/clean-caches.sh
  scripts/git-recover-outside-icloud.sh
  scripts/git-sync-changed-files.sh
  scripts/lib/redact-cli-args.mjs
  scripts/supabase-deploy.mjs
  scripts/ping-supabase-health.mjs
  supabase/MIGRATION_REPAIR_LOG.md
  packages/shared/docs/SUPABASE_DEPLOY.md
  packages/shared/docs/SECURITY_SECRETS.md
  apps/admin-master/content/internal-docs/documentacao-tecnica.md
  .github/workflows/supabase-deploy.yml
  .github/workflows/supabase-health-ping.yml
  apps/admin-master/next-env.d.ts
  apps/admin-master/src/components/admin-shell.tsx
  apps/admin-master/public/autopainel-logo.png
  apps/marketing-site/next-env.d.ts
  apps/marketing-site/src/components/site-header.tsx
  apps/marketing-site/public/autopainel-logo.png
)

ok=0
fail=0
for rel in "${PATHS[@]}"; do
  src_path="$SRC/$rel"
  dest_path="$DEST/$rel"
  if [[ ! -f "$src_path" ]]; then
    echo "  skip (não existe): $rel"
    continue
  fi
  mkdir -p "$(dirname "$dest_path")"
  if perl -e 'alarm 8; exec @ARGV' cp "$src_path" "$dest_path" 2>/dev/null; then
    echo "  ok: $rel"
    ok=$((ok + 1))
  else
    echo "  FALHOU (timeout): $rel"
    fail=$((fail + 1))
  fi
done

echo ""
echo "Copiados: $ok | Falharam: $fail"
if [[ "$fail" -gt 0 ]]; then
  echo "Ficheiros com timeout: reabra o projeto em ~/Developer e aplique manualmente ou via Cursor."
fi
echo ""
echo "Próximo: cd $DEST && git status -uno --short | head"
