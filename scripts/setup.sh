#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado a partir de .env.example."
fi

# Keep all configuration in the root .env and align the PHP application user
# with the user that owns the source tree on the host.
UID_VALUE="$(id -u)"
GID_VALUE="$(id -g)"
sed -i "s/^HOST_UID=.*/HOST_UID=${UID_VALUE}/; s/^HOST_GID=.*/HOST_GID=${GID_VALUE}/" .env

set -a
. ./scripts/load-env.sh
set +a

if [ "${HTTPS_BIND_IP:-192.168.1.100}" = "192.168.1.100" ]; then
    echo "Edite .env e configure HTTPS_BIND_IP antes de continuar." >&2
    exit 1
fi

# Generate secrets only when the sample placeholders are still present.
if grep -q '^MYSQL_PASSWORD=change-me-db-user$' .env; then
    sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$(openssl rand -hex 24)/" .env
fi

if grep -q '^MYSQL_ROOT_PASSWORD=change-me-db-root$' .env; then
    sed -i "s/^MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$(openssl rand -hex 32)/" .env
fi

if grep -q '^REDIS_PASSWORD=change-me-redis$' .env; then
    sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 24)/" .env
fi

if grep -q '^APP_KEY=$' .env; then
    APP_KEY_VALUE="base64:$(openssl rand -base64 32 | tr -d '\n')"
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY_VALUE}|" .env
fi

set -a
. ./scripts/load-env.sh
set +a

# Create a local HTTPS certificate only when it is missing or no longer
# matches HTTPS_BIND_IP. The certificate is intentionally self-signed because
# this stack is designed for an internal/private network.
mkdir -p certs
CERT_OK=0
if [ -f certs/server.crt ] && openssl x509 -in certs/server.crt -noout >/dev/null 2>&1; then
    if openssl x509 -in certs/server.crt -noout -checkip "${HTTPS_BIND_IP}" >/dev/null 2>&1; then
        CERT_OK=1
    fi
fi

if [ "${CERT_OK}" -eq 0 ]; then
    echo "Gerando certificado HTTPS para ${HTTPS_BIND_IP}..."
    openssl req \
        -x509 \
        -nodes \
        -newkey rsa:4096 \
        -sha256 \
        -days "${CERT_VALID_DAYS:-825}" \
        -keyout certs/server.key \
        -out certs/server.crt \
        -subj "/C=BR/ST=GO/L=Internal/O=${APP_NAME:-AppStack}/CN=${HTTPS_BIND_IP}" \
        -addext "subjectAltName=IP:${HTTPS_BIND_IP}"
    chmod 600 certs/server.key
    chmod 644 certs/server.crt
else
    echo "Certificado HTTPS existente e compatível com ${HTTPS_BIND_IP}."
fi

# The project is new: this is the only one-time ownership normalization.
# Runtime processes are configured to use HOST_UID/HOST_GID, so new files do
# not need a recurring permission-fix command.
echo "Construindo imagens Docker..."
docker compose build

# One-time normalization for a fresh project or files left by an earlier
# version. This is intentionally inside setup; there is no recurring
# fix-permissions command in the project.
echo "Alinhando propriedade dos arquivos do backend com o usuário do host..."
docker compose run --rm --no-deps --entrypoint sh api -c "chown -R ${HOST_UID}:${HOST_GID} /var/www/html && find /var/www/html -type d -exec chmod u+rwx {} + && find /var/www/html -type f -exec chmod u+rw {} +"

echo "Iniciando serviços..."
docker compose up -d

echo
echo "Status:"
docker compose ps

echo
echo "API: ${APP_URL}/api/health"
