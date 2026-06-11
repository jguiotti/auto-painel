#!/usr/bin/env bash
# Remove build caches (safe; reinstall with npm install / npm run dev).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ A remover caches de build..."

find apps -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find apps -name "out" -type d -prune -exec rm -rf {} + 2>/dev/null || true
rm -rf .turbo node_modules/.cache .eslintcache 2>/dev/null || true
rm -rf playwright-report test-results 2>/dev/null || true

echo "→ Feito. Espaço livre:"
df -h /System/Volumes/Data 2>/dev/null | awk 'NR==2 {print "  "$4" livres ("$5" usado)"}'
