#!/usr/bin/env bash
# Recuperação quando .git/index ou read-tree dá timeout (pasta em iCloud Documents).
# Clona repo limpo fora do iCloud e copia alterações locais por cima.
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/Developer/auto-painel}"

REMOTE="$(git -C "$SRC" remote get-url origin 2>/dev/null || true)"
if [[ -z "$REMOTE" ]]; then
  echo "Sem remote origin. Configure: git remote add origin <url>"
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
if [[ -d "$DEST/.git" ]]; then
  echo "Destino já existe: $DEST"
  exit 1
fi

echo "→ Clone para $DEST (fora do iCloud)..."
git clone "$REMOTE" "$DEST"
cd "$DEST"

echo "→ A copiar ficheiros alterados (sem .git, node_modules, .turbo)..."
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude .turbo \
  --exclude apps/*/.next \
  "$SRC/" "$DEST/"

echo ""
echo "OK. Próximos passos:"
echo "  cd $DEST"
echo "  npm install"
echo "  git status -uno --short | head"
echo "  git add ... && git commit -m '...'"
echo ""
echo "Quando validar, pode renomear a pasta antiga e usar esta como principal."
