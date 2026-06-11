#!/usr/bin/env bash
# Remove env files from git index (keeps files on disk). Safe to re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

paths=(
  ".env.local"
  ".env"
  "apps/admin-master/.env.local"
  "apps/customer-site/.env.local"
  "apps/dealership-panel/.env.local"
  "apps/marketing-site/.env.local"
  "supabase/.env"
  "supabase/.env.local"
)

echo "A remover do índice git (ficheiros mantêm-se no disco)..."
git rm -r --cached --ignore-unmatch "${paths[@]}" 2>/dev/null || true

echo "Feito. Se houve alterações no índice, commite:"
echo '  git commit -m "chore: stop tracking local env files"'
