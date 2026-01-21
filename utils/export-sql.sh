#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <query.sql> [db_name] [output.csv]" >&2
  exit 1
fi

SQL_FILE="$1"
DB_NAME="${2:-${PGDATABASE:-}}"
OUTPUT_FILE="${3:-query-output.csv}"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Error: SQL file not found: $SQL_FILE" >&2
  exit 1
fi

if [[ -z "$DB_NAME" ]]; then
  echo "Error: database name not provided and PGDATABASE not set" >&2
  exit 1
fi

QUERY="$(<"$SQL_FILE")"

psql "$DB_NAME" \
  -v ON_ERROR_STOP=1 \
  --quiet \
  --no-align \
  --field-separator=',' \
  --pset footer=off \
  --command "\copy ($QUERY) TO '$OUTPUT_FILE' CSV HEADER"

echo "Exported to $OUTPUT_FILE"
