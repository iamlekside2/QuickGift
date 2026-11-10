#!/usr/bin/env bash
# Copy the QuickGift database from the current host (Neon) into Amazon RDS.
# Keeps all existing data: waitlist signups, admin/staff, products, orders, etc.
#
# Prereqs: a local `pg_dump`/`pg_restore` whose major version is >= the servers
# (PG 15/16). On Windows, run this from Git Bash with PostgreSQL client tools on
# PATH (e.g. "C:\Program Files\PostgreSQL\16\bin").
#
# Usage:
#   SOURCE_DATABASE_URL='postgres://...neon.tech/db?sslmode=require' \
#   TARGET_DATABASE_URL='postgres://user:pass@your-rds...rds.amazonaws.com:5432/quickgift?sslmode=require' \
#   ./scripts/migrate-neon-to-rds.sh
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL (the current/Neon connection string)}"
: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL (the new RDS connection string)}"

DUMP="quickgift_$(date +%Y%m%d_%H%M%S).dump"

echo "==> Dumping from source..."
pg_dump --no-owner --no-privileges --format=custom --file="$DUMP" "$SOURCE_DATABASE_URL"
echo "    wrote $DUMP ($(du -h "$DUMP" | cut -f1))"

echo "==> Restoring into target (RDS)..."
# --clean --if-exists makes the restore idempotent (safe to re-run into the same DB).
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname="$TARGET_DATABASE_URL" "$DUMP"

echo "==> Row-count sanity check on the target:"
psql "$TARGET_DATABASE_URL" -c "SELECT
  (SELECT count(*) FROM users)            AS users,
  (SELECT count(*) FROM products)         AS products,
  (SELECT count(*) FROM waitlist_signups) AS waitlist;"

echo "==> Done. Point the backend's DATABASE_URL at RDS and redeploy."
echo "    Run POST /admin/seed only if the admin account did not come across."
