#!/usr/bin/env bash
# ============================================================
# backup-databases.sh
# Dumps all 5 PostgreSQL databases from running Docker containers.
# Run manually or via cron: 0 2 * * * /path/to/backup-databases.sh
# ============================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/fullstack-boilerplate}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Database configs: container|user|db
DBS=(
  "auth-db|auth_user|auth_db"
  "user-db|user_user|user_db"
  "notification-db|notif_user|notification_db"
  "tweet-db|tweet_user|tweet_db"
  "media-db|media_user|media_db"
)

echo "[$(date -Is)] Starting backup run: $TIMESTAMP"

for entry in "${DBS[@]}"; do
  IFS='|' read -r container user db <<< "$entry"

  outfile="$BACKUP_DIR/${db}_${TIMESTAMP}.dump"

  echo "  → Dumping $db from container $container …"

  docker exec "$container" \
    pg_dump -U "$user" -d "$db" -F c -Z 6 \
    > "$outfile"

  size=$(du -sh "$outfile" | cut -f1)
  echo "    ✓ Written: $outfile ($size)"
done

# ── Retention cleanup ──────────────────────────────────────
echo "  → Removing backups older than ${RETENTION_DAYS} days …"
find "$BACKUP_DIR" -name "*.dump" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date -Is)] Backup complete."
