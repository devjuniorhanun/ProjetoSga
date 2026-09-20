FROM php:8.4-fpm-bookworm

ARG PUID=1000
ARG PGID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libzip-dev libicu-dev libpng-dev libonig-dev libxml2-dev \
    libpq-dev curl ca-certificates \
    && docker-php-ext-install pdo_mysql mbstring bcmath intl zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

RUN groupadd -g ${PGID} appgroup 2>/dev/null || true \
    && useradd -m -u ${PUID} -g ${PGID} -s /bin/bash appuser 2>/dev/null || true

WORKDIR /var/www/html
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN sed -i '/^[;[:space:]]*pid =/d; /^\[global\]/a pid = /tmp/php-fpm.pid' /usr/local/etc/php-fpm.conf
RUN sed -i "s|^user = .*|user = appuser|; s|^group = .*|group = appgroup|; /^[;[:space:]]*clear_env[[:space:]]*=/d; /^\[www\]/a clear_env = no" /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|^error_log = .*|error_log = /tmp/php-fpm-error.log|' /usr/local/etc/php-fpm.conf

RUN printf '%s\n' \
'[opcache]' \
'opcache.enable=1' \
'opcache.validate_timestamps=1' \
'opcache.revalidate_freq=0' \
'opcache.memory_consumption=128' \
'opcache.max_accelerated_files=20000' \
> /usr/local/etc/php/conf.d/opcache.ini

RUN chown -R ${PUID}:${PGID} /var/www

EXPOSE 9000
USER appuser
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm", "-F"]
