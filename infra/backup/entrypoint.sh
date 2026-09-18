#!/bin/sh
set -eu

mkdir -p /backups

BACKUP_HOUR="${BACKUP_TIME%:*}"
BACKUP_MINUTE="${BACKUP_TIME#*:}"

case "${BACKUP_HOUR}" in
    ''|*[!0-9]*) echo "BACKUP_TIME inválido: ${BACKUP_TIME}" >&2; exit 1 ;;
esac
case "${BACKUP_MINUTE}" in
    ''|*[!0-9]*) echo "BACKUP_TIME inválido: ${BACKUP_TIME}" >&2; exit 1 ;;
esac

cat > /etc/cron.d/mysql-backup <<CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${BACKUP_MINUTE} ${BACKUP_HOUR} * * * root /usr/local/bin/backup.sh >> /var/log/mysql-backup.log 2>&1
CRON

chmod 0644 /etc/cron.d/mysql-backup
touch /var/log/mysql-backup.log

echo "Agendador de backup MySQL configurado para ${BACKUP_TIME}."

# One backup at startup makes a newly created environment recoverable
# immediately; scheduled backups continue at BACKUP_TIME.
/usr/local/bin/backup.sh

tail -f /var/log/mysql-backup.log &
LOG_PID=$!
trap 'kill "${LOG_PID}" 2>/dev/null || true' EXIT INT TERM

exec crond -n
