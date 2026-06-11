#!/usr/bin/env bash
#
# Reescreve o histórico git para substituir segredos literais por [REDACTED].
# ATENÇÃO: altera todos os commits; exige force-push e coordenação com a equipa.
#
# Pré-requisitos:
#   brew install git-filter-repo
#
# Uso:
#   1. Copie .secrets-purge-local.example.txt → .secrets-purge-local.txt (gitignored)
#   2. Uma linha por segredo literal (token, senha, etc.)
#   3. npm run git:purge-secrets -- --dry-run
#   4. npm run git:purge-secrets
#   5. git push --force-with-lease origin main
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SECRETS_FILE="${ROOT}/.secrets-purge-local.txt"
REPLACEMENTS_FILE="${ROOT}/replacements-purge-secrets.txt"
DRY_RUN=false

for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  fi
done

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Instale git-filter-repo: brew install git-filter-repo"
  exit 1
fi

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Crie ${SECRETS_FILE} (ver .secrets-purge-local.example.txt)."
  echo "Uma linha por valor secreto a apagar do histórico."
  exit 1
fi

: >"$REPLACEMENTS_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  trimmed="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$trimmed" || "$trimmed" == \#* ]] && continue
  # git-filter-repo replace-text format: literal:OLD==>NEW
  escaped="${trimmed//\\/\\\\}"
  echo "literal:${escaped}==>[REDACTED]" >>"$REPLACEMENTS_FILE"
done <"$SECRETS_FILE"

# Padrões comuns (tokens Supabase CLI sbp_...)
echo 'regex:sbp_[0-9a-f]{20,}==>[REDACTED_SUPABASE_TOKEN]' >>"$REPLACEMENTS_FILE"

echo "Substituições geradas em replacements-purge-secrets.txt ($(wc -l <"$REPLACEMENTS_FILE" | tr -d ' ') regras)"

if $DRY_RUN; then
  echo ""
  echo "[dry-run] Ficheiro de substituições:"
  sed 's/==>/ → /' "$REPLACEMENTS_FILE" | sed 's/^/  /'
  echo ""
  echo "[dry-run] Working tree (rg, sem varrer histórico — git log -S trava neste repo):"
  if command -v rg >/dev/null 2>&1; then
    rg -l "sbp_" --glob '!.git' --glob '!node_modules' --glob '!.next' . 2>/dev/null | head -10 || echo "  nenhum ficheiro no working tree"
  else
    echo "  (instale ripgrep para scan local: brew install ripgrep)"
  fi
  echo ""
  echo "[dry-run] Auditar histórico manualmente (opcional, pode demorar):"
  echo "  git log --oneline -n 30 -S 'sbp_'"
  echo ""
  echo "[dry-run] Para aplicar: npm run git:purge-secrets"
  echo "Depois: git push --force-with-lease origin main"
  exit 0
fi

echo ""
echo "AVISO: isto reescreve o histórico local. Confirme em 10s (Ctrl+C para cancelar)..."
sleep 10

git filter-repo --force --replace-text "$REPLACEMENTS_FILE"

echo ""
echo "Histórico reescrito. Próximos passos:"
echo "  1. npm run env:check-tracked"
echo "  2. git push --force-with-lease origin main"
echo "  3. Peça à equipa para clonar de novo ou: git fetch && git reset --hard origin/main"
echo ""
echo "Apague replacements-purge-secrets.txt e .secrets-purge-local.txt quando terminar."
