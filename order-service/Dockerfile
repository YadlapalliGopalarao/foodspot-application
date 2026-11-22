
FROM php:8.4-apache

WORKDIR /var/www/html

# Install required PHP extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libonig-dev \
        libzip-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        zip \
        opcache \
    && rm -rf /var/lib/apt/lists/*

# Enable production PHP configuration
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configure Apache on port 8080
RUN a2enmod rewrite \
    && sed -i 's/Listen 80/Listen 8080/' \
        /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' \
        /etc/apache2/sites-available/000-default.conf \
    && sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' \
        /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' \
        '<Directory /var/www/html/public>' \
        '    AllowOverride All' \
        '    Require all granted' \
        '    Options -Indexes +FollowSymLinks' \
        '</Directory>' \
        > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

COPY . .

# Install production dependencies
RUN mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --no-progress \
        --optimize-autoloader \
    && chown -R www-data:www-data \
        storage \
        bootstrap/cache \
        /var/run/apache2 \
        /var/lock/apache2 \
        /var/log/apache2

# Non-root execution
USER www-data

EXPOSE 8080

CMD ["sh", "-c", "php artisan config:cache && exec apache2-foreground"]
