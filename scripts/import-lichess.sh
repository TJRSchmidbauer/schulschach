#!/bin/sh
set -e
URL="${LICHESS_PUZZLE_URL:-https://database.lichess.org/lichess_db_puzzle.csv.zst}"
echo "[import] Lade $URL (gestreamt, keine Zwischendatei) ..."
curl -fsSL "$URL" | zstd -d -c --memory=1024MB | npx tsx scripts/import-lichess.ts "$@"
