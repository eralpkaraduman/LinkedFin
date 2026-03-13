#!/bin/sh
set -e

echo "Generating SQL dump..."
npx tsx maintenance/scripts/db-dump.ts > fish.sql

echo "Syncing to D1..."
npx wrangler d1 execute linkedfin-db --remote --file=fish.sql

rm fish.sql
echo "Done."
