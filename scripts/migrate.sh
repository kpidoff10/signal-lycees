#!/usr/bin/env bash
# Crée une migration à partir du schéma sans laisser Prisma supprimer l'index
# vectoriel HNSW (que Prisma ne sait pas décrire). Usage : ./scripts-migrate.sh nom_migration
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:?nom de migration requis}"
dir="prisma/migrations/$(date -u +%Y%m%d%H%M%S)_${name}"
mkdir -p "$dir"
./dev.sh npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script 2>/dev/null \
  | grep -v -E 'Issue_embedding_hnsw_idx|^-- DropIndex$|Loaded Prisma config' > "$dir/migration.sql"
echo "Migration écrite dans $dir :"; cat "$dir/migration.sql"
./dev.sh npx prisma migrate deploy 2>&1 | grep -v notice | tail -3
./dev.sh npx prisma generate 2>&1 | grep -E 'Generated|rror'
