#!/bin/sh
set -eu

TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
BACKUP_FILE="/backups/${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

cleanup() {
    rm -f "${TEMP_FILE}"
}
trap cleanup EXIT INT TERM

echo "[$(date -Iseconds)] Iniciando backup MySQL: ${BACKUP_FILE}"

mysqldump \
    --host="${MYSQL_HOST}" \
    --port="${MYSQL_PORT}" \
    --user="${MYSQL_USER}" \
    --password="${MYSQL_PASSWORD}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --no-tablespaces \
    "${MYSQL_DATABASE}" | gzip > "${TEMP_FILE}"

mv "${TEMP_FILE}" "${BACKUP_FILE}"

find /backups \
    -type f \
    -name '*.sql.gz' \
    -mtime +"${BACKUP_RETENTION_DAYS}" \
    -delete

echo "[$(date -Iseconds)] Backup concluído com sucesso: ${BACKUP_FILE}"
