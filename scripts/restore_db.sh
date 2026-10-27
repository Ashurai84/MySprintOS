#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz | path_to_backup_file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=== SprintOS Database Restoration ==="
echo "Source: $BACKUP_FILE"
echo "Target DB: sprintos_db"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | /opt/homebrew/bin/psql -U ashutoshrai -d sprintos_db
else
    /opt/homebrew/bin/psql -U ashutoshrai -d sprintos_db -f "$BACKUP_FILE"
fi

echo "✓ Database restored successfully."
