#!/usr/bin/env bash
# Repara git quando aparece:
#   fatal: .git/index: unable to map index file: Operation timed out
#
# Estratégia: restaurar backup → só se falhar, read-tree com timeout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ A terminar processos git presos..."
pkill -9 -f "git status" 2>/dev/null || true
pkill -9 -f "git read-tree" 2>/dev/null || true
pkill -9 -f "git commit" 2>/dev/null || true
rm -f .git/index.lock 2>/dev/null || true

AVAIL_GB="$(df -g /System/Volumes/Data 2>/dev/null | awk 'NR==2 {print $4}')"
if [[ -n "$AVAIL_GB" && "$AVAIL_GB" -lt 10 ]]; then
  echo ""
  echo "AVISO: disco com ~${AVAIL_GB} GB livres (recomendado > 15 GB)."
  echo "  Limpe caches: npm run clean:caches  (ou manualmente .next, Docker, Lixeira)"
  echo ""
fi

try_status() {
  git status -uno --short >/dev/null 2>&1
}

BACKUP=".git/index.corrupt.bak"
if [[ -f "$BACKUP" ]]; then
  echo "→ A restaurar índice a partir de $BACKUP ..."
  cp "$BACKUP" .git/index
  if try_status; then
    echo "OK: índice restaurado do backup."
    git status -uno --short | head -20
    exit 0
  fi
  echo "Backup não funcionou; a tentar read-tree..."
fi

export GIT_INDEX_FILE="${TMPDIR:-/tmp}/autopainel-git-index-repair-$$"
rm -f "$GIT_INDEX_FILE" "${GIT_INDEX_FILE}.lock"

echo "→ read-tree com timeout 30s em $GIT_INDEX_FILE ..."
if perl -e 'alarm 30; exec @ARGV' git read-tree HEAD 2>/dev/null; then
  if cp "$GIT_INDEX_FILE" .git/index 2>/dev/null && try_status; then
    rm -f "$GIT_INDEX_FILE" "${GIT_INDEX_FILE}.lock"
    echo "OK: índice reconstruído."
    git status -uno --short | head -20
    exit 0
  fi
fi

kill -9 $(pgrep -f "git read-tree" 2>/dev/null) 2>/dev/null || true
rm -f "${GIT_INDEX_FILE}.lock" 2>/dev/null || true

echo ""
echo "Falhou. Com disco quase cheio, git read-tree trava."
echo "1. Liberte espaço (meta: 15+ GB livres)"
echo "2. Rode: npm run clean:caches"
echo "3. Rode de novo: npm run git:repair-index"
echo ""
echo "Workaround temporário para commit:"
echo "  export GIT_INDEX_FILE=$GIT_INDEX_FILE"
echo "  git read-tree HEAD   # quando terminar"
echo "  git add <ficheiros> && git commit -m '...'"
exit 1
