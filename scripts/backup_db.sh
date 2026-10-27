#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups/db"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sprintos_db_$TIMESTAMP.sql.gz"

echo "=== SprintOS Database Backup ==="
echo "Target: $BACKUP_FILE"

/opt/homebrew/bin/pg_dump -U ashutoshrai -d sprintos_db --clean --if-exists | gzip > "$BACKUP_FILE"

FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✓ Backup completed successfully ($FILESIZE)"
