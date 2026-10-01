#!/bin/sh
set -e
echo "[schulschach] Prisma db push ..."
npx prisma db push --skip-generate
echo "[schulschach] Seed (idempotent) ..."
npx tsx prisma/seed.ts
echo "[schulschach] Starte Next.js ..."
exec npm run start
