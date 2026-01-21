#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "🚨 DATABASE MIGRATION (DESTRUCTIVE OPERATION)"
echo "=============================================="
echo
echo "This will:"
echo " - DROP the destination database"
echo " - TERMINATE active connections"
echo " - RECREATE the database"
echo " - ENABLE postgis"
echo " - RESTORE data from source"
echo
read -rp "Type 'DESTROY' to continue: " CONFIRM
if [[ "$CONFIRM" != "DESTROY" ]]; then
  echo "Aborted."
  exit 1
fi

echo
echo "---------- SOURCE DATABASE ----------"

DEFAULT_SRC_HOST="127.0.0.1"
DEFAULT_SRC_PORT="5432"

read -rp "Source DB host [$DEFAULT_SRC_HOST]: " SRC_HOST_INPUT
SRC_HOST="${SRC_HOST_INPUT:-$DEFAULT_SRC_HOST}"

read -rp "Source DB port [$DEFAULT_SRC_PORT]: " SRC_PORT_INPUT
SRC_PORT="${SRC_PORT_INPUT:-$DEFAULT_SRC_PORT}"

read -rp "Source DB name: " SRC_DB
read -rp "Source DB user: " SRC_USER
read -rsp "Source DB password: " SRC_PASS
echo

echo
echo "---------- DESTINATION DATABASE ----------"

DEFAULT_DST_HOST="192.168.40.35"
DEFAULT_DST_PORT="5432"

read -rp "Destination DB host [$DEFAULT_DST_HOST]: " DST_HOST_INPUT
DST_HOST="${DST_HOST_INPUT:-$DEFAULT_DST_HOST}"

read -rp "Destination DB port [$DEFAULT_DST_PORT]: " DST_PORT_INPUT
DST_PORT="${DST_PORT_INPUT:-$DEFAULT_DST_PORT}"

read -rp "Destination DB name: " DST_DB
read -rp "Destination DB user: " DST_USER
read -rsp "Destination DB password: " DST_PASS
echo

echo
echo "🚨 FINAL CONFIRMATION 🚨"
echo "Destination:"
echo "  Host: $DST_HOST:$DST_PORT"
echo "  DB:   $DST_DB"
echo
read -rp "Type the DESTINATION DB NAME to confirm: " CONFIRM_DB

if [[ "$CONFIRM_DB" != "$DST_DB" ]]; then
  echo "Database name mismatch. Aborted."
  exit 1
fi

DUMP_FILE="/tmp/${SRC_DB}_$(date +%Y%m%d_%H%M%S).dump"

echo
echo "📦 Dumping source database..."

PGPASSWORD="$SRC_PASS" pg_dump \
  -h "$SRC_HOST" \
  -p "$SRC_PORT" \
  -U "$SRC_USER" \
  -Fc \
  -f "$DUMP_FILE" \
  "$SRC_DB"

echo "Dump created at: $DUMP_FILE"

echo
echo "🔥 DESTROYING destination database..."

export PGPASSWORD="$DST_PASS"

psql -h "$DST_HOST" -p "$DST_PORT" -U "$DST_USER" postgres <<EOF
-- terminate connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DST_DB'
  AND pid <> pg_backend_pid();

-- drop & recreate
DROP DATABASE IF EXISTS "$DST_DB";
CREATE DATABASE "$DST_DB";
EOF

echo
echo "🧱 Enabling postgis extension..."

psql -h "$DST_HOST" -p "$DST_PORT" -U "$DST_USER" "$DST_DB" <<EOF
CREATE EXTENSION IF NOT EXISTS postgis;
EOF

echo
echo "📥 Restoring database..."

pg_restore \
  -h "$DST_HOST" \
  -p "$DST_PORT" \
  -U "$DST_USER" \
  -d "$DST_DB" \
  --no-owner \
  --role="$DST_USER" \
  --disable-triggers \
  --verbose \
  "$DUMP_FILE"

echo
echo "✅ Migration completed successfully"
echo "Dump file kept at: $DUMP_FILE"
