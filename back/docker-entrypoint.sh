#!/bin/sh
set -eu

cd /var/www/html

if [ ! -f vendor/autoload.php ]; then
    echo "vendor/ não encontrado. Instalando dependências do Laravel..."
    composer install --no-interaction --prefer-dist --no-progress
else
    echo "vendor/ encontrado. Pulando composer install."
fi

if [ -z "${APP_KEY:-}" ]; then
    echo "ERRO: APP_KEY não está definido no .env da raiz. Execute ./scripts/setup.sh." >&2
    exit 1
fi

mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

php artisan package:discover --ansi
php artisan migrate --force --graceful --ansi

exec "$@"
