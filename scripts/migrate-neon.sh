#!/usr/bin/env bash
# macOS-only Neon → Neon copy via pg_dump → pg_restore
# Prereq: Homebrew postgres client tools: brew install libpq && brew link --force libpq
set -euo pipefail

SRC='postgresql://neondb_owner:npg_JyhbQiL69SqZ@ep-falling-block-adg8ls8i-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
DST='postgresql://neondb_owner:npg_akJGpIFN1Z7t@ep-rapid-bonus-aepgtwr9-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

echo "[1/5] Connectivity check"
psql "$SRC" -Atc "select 'SRC', current_database(), current_user;" >/dev/null
psql "$DST" -Atc "select 'DST', current_database(), current_user;" >/dev/null

STAMP="$(date +%Y%m%d_%H%M%S)"
DUMP="neon_backup_${STAMP}.dump"

echo "[2/5] Dumping source → $DUMP"
pg_dump "$SRC" --format=custom --no-owner --no-privileges --blobs --verbose --file="$DUMP"

echo "[3/5] Ensuring extensions on destination"
psql "$DST" -v ON_ERROR_STOP=1 -c "create extension if not exists pgcrypto;"
psql "$DST" -v ON_ERROR_STOP=1 -c "create extension if not exists uuid-ossp;" || true

echo "[4/5] Restoring into destination (clean if exists)"
pg_restore --no-owner --no-privileges --clean --if-exists --verbose --jobs=4 --dbname="$DST" "$DUMP"

echo "[5/5] Verifying counts (Event table)"
SRC_EVENTS=$(psql "$SRC" -Atc "select count(*) from \"Event\";" 2>/dev/null || echo 0)
DST_EVENTS=$(psql "$DST" -Atc "select count(*) from \"Event\";" 2>/dev/null || echo 0)
echo "Event count SRC=$SRC_EVENTS DST=$DST_EVENTS"
[ "$SRC_EVENTS" = "$DST_EVENTS" ] || echo "Warning: counts differ"

echo "Done. Dump file: $DUMP"
