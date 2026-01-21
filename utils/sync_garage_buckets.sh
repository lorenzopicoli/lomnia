
#!/usr/bin/env bash
set -euo pipefail

DEFAULT_SRC_ENDPOINT="http://127.0.0.1:3900"
DEFAULT_DST_ENDPOINT="http://192.168.40.35:3900"

read -rp "Source Garage endpoint [$DEFAULT_SRC_ENDPOINT]: " SRC_INPUT
SRC_ENDPOINT="${SRC_INPUT:-$DEFAULT_SRC_ENDPOINT}"

read -rp "Destination Garage endpoint [$DEFAULT_DST_ENDPOINT]: " DST_INPUT
DST_ENDPOINT="${DST_INPUT:-$DEFAULT_DST_ENDPOINT}"

echo
read -rp "Source AWS Access Key ID: " SRC_ACCESS_KEY
read -rsp "Source AWS Secret Access Key: " SRC_SECRET_KEY
echo

read -rp "Destination AWS Access Key ID: " DST_ACCESS_KEY
read -rsp "Destination AWS Secret Access Key: " DST_SECRET_KEY
echo

export AWS_DEFAULT_REGION=garage
export TMP=/tmp/garage-migration

mkdir -p "$TMP"

echo
echo "Fetching bucket list from source..."
export AWS_ACCESS_KEY_ID="$SRC_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SRC_SECRET_KEY"

BUCKETS=$(aws s3 ls --endpoint-url "$SRC_ENDPOINT" | awk '{print $3}')

if [[ -z "$BUCKETS" ]]; then
  echo "No buckets found on source."
  exit 0
fi

for bucket in $BUCKETS; do
  echo
  echo "=== Syncing bucket: $bucket ==="

  mkdir -p "$TMP/$bucket"

  aws s3 sync "s3://$bucket" "$TMP/$bucket" \
    --endpoint-url "$SRC_ENDPOINT" \
    --no-progress \
    --size-only

  export AWS_ACCESS_KEY_ID="$DST_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$DST_SECRET_KEY"

  aws s3 mb "s3://$bucket" \
    --endpoint-url "$DST_ENDPOINT" 2>/dev/null || true

  aws s3 sync "$TMP/$bucket" "s3://$bucket" \
    --endpoint-url "$DST_ENDPOINT" \
    --no-progress \
    --size-only

  export AWS_ACCESS_KEY_ID="$SRC_ACCESS_KEY"
  export AWS_SECRET_ACCESS_KEY="$SRC_SECRET_KEY"
done

rm -rf "$TMP"
echo
echo "Migration complete 🎉"
echo "Data staged in: $TMP"
